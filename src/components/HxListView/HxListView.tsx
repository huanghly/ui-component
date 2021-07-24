import React, { useEffect, useRef, useReducer, useState } from 'react';
import { ListView, PullToRefresh, Flex, ActivityIndicator } from 'antd-mobile';
import listReducer from './listReducer';
import AppEmpty from './Empty';
import Fetch from '../../utils/Fetch'
import { stringify } from 'qs';
import { omit } from 'lodash';
import './index.less';
interface IFilterParams {
  current?: number;
  size?: number;

  [propName: string]: any;
}
interface CallbackResult {
  [propName: string]: any;
}

interface IHxListPorps {
  size?: number,
  listItemKey: any,
  getList?: (listFilter?: IFilterParams, callback?: (res: CallbackResult) => void) => void, // 某些情况下，需要先请求其他的数据再请求列表的数据
  API?: string, // 请求列表的URL， 
  defaultParams?: any, //请求API参数中如有固定参数，放在这里
   className?: string,
  renderRow: () => React.ReactElement<any>,
  renderFooter?: string | React.ReactNode;
  showAppListEmpty?: boolean | React.ReactNode | (() => React.ReactNode);
  emptyText?: string | React.ReactNode;
  emptyImg?: React.ReactNode;
  isInitfresh: boolean, // 在原生页面每次出现刷新列表的场景需要使用,此时与组件初始化调的方向相同
}
/**
 * // TODO：
 * 1. 外部getList() ? getList() : 内部API方法调用;  => 是否是有外部的getList({},)的时候，调用外部的getList()不再调用内部的API, 
 * 2. 列表数据请求分为： 数据初始化， 顶部下拉刷新， 触底加载更多
 * 3. 底部支持自定义renderFooter, 底部文案支持外部传入，外部没有传的时候显示内部默认值
 * 4. 顶部下拉刷新的slogan采用海心自定义的文案图标
 * 5. 列表renderRow是必传值，由外部传入
 * 6. 列表数据为空的时候，展示兜底空状态，此时不展示renderFooter，支持空状态的文案由外部传入
 * 7. 只有初次加载的时候才有页面loading的状态，是大菊花状态，其他顶部下拉刷新，触底加载更多，局部小菊花状态
 * 8. loading状态枚举值得： waitLoading(点击加载更多) | loading(数据正在加载中)| noMoreData(数据已全部加载完毕)
 * 9. 暴露一个方法支持在原生页面每次出现刷新列表的场景需要使用，即 根据外部传入使组件内部再一次 初次加载数据
 * 10. listview高度100%
 * 11. 支持外部传入某个size的时候，请求对应页面列表条数，默认页面条数是10
 * 12. 
 */

/**
 * 重点：
 * 1. getList() 的处理；  dataSource 该怎么处理？哪里来？
 * 2. 内部维护的属性有： current, 
 */


const initState = {
  list: [],
  hasMore: false,
  filter: {
    current: 1,
    size: 10,
  },
};
const HxListView: React.FC<IHxListPorps> = (props: IHxListPorps) => {
  const {
    size = 10, // 默认10条
    API,
    getList,
    renderRow,
    listItemKey,
    isInitfresh = true,
    renderFooter,
    defaultParams,
    emptyText = '暂无数据',
    emptyImg,
    showAppListEmpty = true,
     className,
    ...restListViewAttr // // antd-mobile ListView组件其他属性
  } = props;

  const listRef: any = useRef();
  const [isLoading, setIsloading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1);
  const [pullIsLoading, setPullIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('')
  const [state, dispatch] = useReducer(listReducer, {
    ...initState,
  })

  const {
    list,
    filter,
    hasMore,
  } = state;
  const ds = new ListView.DataSource({
    rowHasChanged: (row1: any, row2: any) => row1 !== row2,
  });
  useEffect(() => {
    getListviewData('init');
  }, [isInitfresh]);

  const getListviewData = async (status: string) => {
    if (!getList && !API) {
      throw new Error('you must be privide the value one of the getList or API');
    }
    if (!getList && API) { // 如果没有传getList, 组件内部调用API维护dataSource
      if(status === 'init' || status === 'pull'){ 
        // init： 初始化
        //pull: 相当于初始化，但是顶部露出slogan 
        setCurrentPage(1);
        const params = {
          current: 1,
          size,
          ...defaultParams,
        }
        if(status === 'init'){
          setIsloading(true);
          setLoadingStatus('loading');
        }else {
          setPullIsLoading(true)
        }

        const res = await Fetch(`${API}?${stringify(params)}`, {});
        if(status === 'init'){
          setIsloading(false);
        }else {
          setPullIsLoading(false)
        }
        if (res?.code === 'SUCCESS') {
          const { records = [], current, pages, size, total, } = res.data;
          dispatch({
            type: 'setList',
            payload: records || [],
          });
          handleDispatch('setState', {
            hasMore: total >= records?.length, // true表示加载完毕， no any more data
            filter: {
              ...filter,
              current,
              pages,
              size,
              total,
            },
          });
        }
      } else if (status === 'reach') {
        // 底部加载更多...
        let tempCurrent = currentPage + 1;
        setCurrentPage(tempCurrent);
        const { filter, hasMore, list } = state;
        let current = filter.current;
        if (hasMore) {
          current = filter.current + 1;
          let newFiler = omit(
            {
              ...filter,
            },
            ['total', 'pages'],
          );
          const params = {
            ...newFiler,
            current,
            ...defaultParams,
          };
          setLoadingStatus('loading')
          const res = await Fetch(`${API}?${stringify(params)}`, {})
          if (res && res.code === 'SUCCESS') {
            const { records = [], pages, size, total, } = res.data;
            let hasMore = total >= records?.length;
            handleDispatch('setHasMore', hasMore);
            let tempPayload = {
              list: (list || []).concat(records || []),
              filter: {
                ...filter,
                current: filter.current + 1,
                pages,
                size,
                total,
              },
            };
            handleDispatch('setState', tempPayload);
          }
          setLoadingStatus(hasMore ? 'waitLoad' : 'noMoreData')
        } else {
          setLoadingStatus('noMoreData')
        }
      }
    } else { // getList 
      // 把当前的current传出去
      const { filter } = state;
      let current;
      if (status === 'init') {
        setIsloading(true);
      }
      if (status === 'init' || status === 'pull') {
        current = 1;
        handleDispatch('setState', {
          filter: {
            ...filter,
            current: 1,
          },
        })
      } else if (status === 'reach') {
        current = filter.current + 1;
        handleDispatch('setState', {
          filter: {
            ...filter,
            current: filter.current + 1,
          },
        })
      }
      let filterParams: IFilterParams = { current: current, size: filter.size}
      getList && getList({
        filterParams,
        callback: (payload: any) => {
          handleGetListCallback(payload, status)
        }
      })
    }
  }

  function handleGetListCallback(result: any, status: string) {
    const { data = [], total = 0 } = result;
    let hasMore = data?.length < total; // 出现data === total = 0情况
    setCurrentPage(currentPage + 1);
    handleResultData(data, status,hasMore );
  }

  function handleLoadMore() {
    if (isLoading || loadingStatus === 'noMoreData' || loadingStatus === 'loading' || pullIsLoading) {
      return;
    }
    getListviewData('reach')
  }

  function _renderFooter() {
    return (
      <div className="custom-footer-wrap">
        {loadingStatus === 'loading' ?
          <ActivityIndicator toast animating={isLoading} /> :
          (loadingStatus === 'waitLoad' ?
            <div onClick={handleLoadMore}>点击加载更多数据</div> :
            (loadingStatus === 'noMoreData' ? <div className="no-more-data-wrap">{renderLoadedText()}</div> : ''))}
      </div>
    )
  }

  function renderLoadedText() {
    if (renderFooter) return renderFooter;
    return <p className="custom-no-more-data">数据已经全部加载完毕</p>
  }

  // 触底加载更多
  function onEndReached() {
    getListviewData('reach')
  }

  function renderPull2Refresh() {
    // @ts-ignore
    return <PullToRefresh
      className={`pull-refresh-slogan-container`}
      refreshing={pullIsLoading}
      onRefresh={() => getListviewData('pull')}
      indicator={{
        activate: (
          <div className="pull-slogan-block">
            <img
              src="//static.aistarfish.com/front-release/file/F2020070716041383200000737.slogan.png"
              alt=""
              className="slogan-bg"
            />
          </div>
        ),
        release: (
          <Flex direction="column" className="pull-slogan-block">
            <img
              src="//static.aistarfish.com/front-release/file/F2020070715525362100006444.slogan-default.gif"
              alt=""
              className="slogan-bg"
            />
          </Flex>
        ),
        finish: "完成刷新",
      }}
      distanceToRefresh={80}
    />
  }

  function renderEmpty() {
    if (typeof showAppListEmpty === 'boolean' && showAppListEmpty) { // 传入boolean类型
      return <AppEmpty
        description={emptyText}
        image={emptyImg} />
    }
    return showAppListEmpty
  }
  function handlesScroll() {

  }

  
  function handleDispatch(type: string, params: any) {
    dispatch({
      type,
      payload: params
    });
  }

 function handleResultData(data: any, status: string, hasMore: boolean){
     setIsloading(false);
     setPullIsLoading(false);
     const { list } = state;
     if(data !== undefined){
        let payload =  status === 'init' || status === 'pull' ? (data || []) :(list.concat(data) || []) 
      handleDispatch('setList', payload);
      setLoadingStatus(hasMore ? 'waitLoad' : 'noMoreData')
     }else {
       // 接口返回失败
       if(status === 'init'){
        setIsloading(true);
       } else if(status === 'pull'){
        setPullIsLoading(true);
       }
      setLoadingStatus('loading')
     }
  }

  return (
    <div className={`hx-list-view-container ${className}`} >
      <ActivityIndicator toast animating={isLoading} />
      {!isLoading && list.length === 0 ?
        renderEmpty()
        : <ListView
          style={{ height: '100%' }}
          dataSource={ds.cloneWithRows([...list])}
          ref={listRef}
          renderRow={renderRow}
          onScroll={handlesScroll}
          renderFooter={() => _renderFooter()}
          scrollRenderAheadDistance={500}
          onEndReached={onEndReached}
          onEndReachedThreshold={20}
          {...restListViewAttr}
          pullToRefresh={renderPull2Refresh()}
        />}
    </div>
  )
}

export default HxListView;