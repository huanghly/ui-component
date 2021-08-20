import React, { Fragment, useEffect, useCallback } from 'react';
import { NavBar, Icon } from 'antd-mobile';
import type { NavBarProps } from 'antd-mobile/es/nav-bar/PropsType';
import './index.less';
// @ts-ignore
const hxAppHelper = window?.hxAppHelper!;
export type AppNavbarProps = {
  isShow?: boolean;
  title?: string | React.ReactNode;
  showLeft?: boolean;
  showLeftClose?: boolean;
  rightContent?: React.ReactNode;
  leftContent?: React.ReactNode;
  className?: string;
  noLine?: boolean;
  leftIcon?: React.ReactNode;
} & NavBarProps;

const AppNarBar: React.FC<AppNavbarProps> = props => {
  const { 
    isShow = true,  // 默认隐藏自定义导航栏显示原生导航栏
    title, 
    showLeft,
    rightContent,
    leftContent,
    className,
    noLine,
    leftIcon,
    showLeftClose = false,
    } = props;
   useEffect(() => {
     if (isShow) {
      // 显示/隐藏: App原生Narbar
      hxAppHelper.hideLocalNavBar(true);
      console.log('hideLocalNavBar  true ')
    } else {
      console.log('hideLocalNavBar  false ')
      hxAppHelper.hideLocalNavBar(false);
    }
  }, []);
  const renderRight = useCallback(() => {
    return [rightContent ? rightContent : null];
  }, [rightContent]);

  const renderLeft = useCallback(() => {
    return (
      <Fragment>
        {leftIcon || (
          <div
            key="back"
            className="icon-back"
            onClick={showLeftClose ? handleClickLeft : () => {}}
          ></div>
        )}

        {showLeftClose && (
          <div
            key="close"
            className="icon-close"
            onClick={() => hxAppHelper.navBack()}
          ></div>
        )}
        {leftContent}
      </Fragment>
    );
  }, [showLeftClose, leftContent]);

  function handleClickLeft(){
    // 返回按钮默认行为是浏览器返回,若浏览器不能返回则调用原生页面返回
    let currentUrl = window.location.href;
    window.history.back();
    setTimeout(() => {
      if (currentUrl === window.location.href) {
          hxAppHelper.navBack(); 
      } //如果页面没返回说明已经不能返回了
    }, 100);
  }
return (
  <Fragment>
    {
    isShow && <NavBar
        mode="light"
        leftContent={showLeft ? renderLeft() : null}
        rightContent={renderRight()}
        onLeftClick={showLeftClose ? () => { } : handleClickLeft}
        className={`hx-h5-narbar ${className} ${noLine ? 'no-line' : ''}`}
      >
        {title}
      </NavBar>
    }
  </Fragment>
)
}

AppNarBar.defaultProps = {
  isShow: true,
  title: '',
  showLeft: true,
  showLeftClose: false,
  rightContent: null,
  leftContent: null,
  className: '',
  noLine: false,
}

export default AppNarBar;



