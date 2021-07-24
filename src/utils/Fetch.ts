
import "whatwg-fetch";
// https://www.npmjs.com/package/whatwg-fetch
import { Toast } from "antd-mobile";

interface IReuqest {
  options?: any,
  overDueTime?: number,
  isSilent?: boolean,
  isAppReq?: boolean,
  [propName: string]: any;
}

interface IError {
  tag?: string,
  response?: any,
  code?: string
}

// @ts-ignore
const hxAppHelper = window.hxAppHelper;

export function createURL(url:string, param: any): string {
  const queryKeys = Object.keys(param);
  let queryArr = [];
  for (let i = 0; i < queryKeys.length; i++) {
    if (queryKeys[i]) {
      queryArr.push(
        encodeURIComponent(queryKeys[i]) +
          "=" +
          encodeURIComponent(param[queryKeys[i]])
      );
    }
  }
  const queryStr = queryArr.join("&");
  return url + `?${queryStr}`;
}

export function getUrlParam(url: string){
  url = url || "";
  let params = {};
  if (url.split("?").length >= 2) {
    let queryStr = url.split("?")[1];
    let paramsArr = queryStr.split("&");
    for (let i = 0; i < paramsArr.length; i++) {
      let value = paramsArr[i].split("=");
      // @ts-ignore
      params[value[0]] = value[1];
    }
    return params;
  } else {
    return params;
  }
}


function getData(data:any, isSilent: boolean, isAppReq: boolean){
  if (!data) {
    const error = new Error("服务器返回数据异常") as IError;
    error.tag = "custom";
    error.response = data;
    error.code = "DATA_ERROR";
    throw error;
  } else if (data.code && data.msg) {
    if (isAppReq) {
      // 是app请求
      if (data.success !== true) {
        if (data.code === "INVALID_TOKEN") {
          hxAppHelper.errorCodeManage({
            errorCode: "INVALID_TOKEN",
            response: data,
          });
        } else if (data.code === "OLD_APP_VERSION_DETECTED") {
          hxAppHelper.errorCodeManage({
            errorCode: "OLD_APP_VERSION_DETECTED",
            response: data,
          });
        } else {
          // 成功后对出错的CODE统一处理
          !isSilent && data.msg && Toast.fail(data.msg);
        }
      }
    } else {
      if (data.success !== true) {
        // 成功后对出错的CODE统一处理
        !isSilent && data.msg && Toast.fail(data.msg);
      }
    }
  }
  console.log(isAppReq, isSilent, data);
  return data;
}

 
function baseFetch(params: IReuqest ) {
  let { url, options,  overDueTime } = params;
   let fetch_promise = fetch(url, options);
  //这是一个可以被reject的promise
  let abort_promise = new Promise(function (resolve, reject) {
    let timeout = overDueTime;
    if (!timeout) {
      timeout = 8000;
    }
    setTimeout(() => {
      const error = new Error("网络开小差了") as IError;
      error.tag = "custom";
      error.code = "NET_ERROR";
      reject(error);
    }, timeout);
  });
  //这里使用Promise.race，以最快 resolve 或 reject 的结果来传入后续绑定的回调
  return Promise.race([fetch_promise, abort_promise]);
}

function checkStatus(response: any) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    console.log("errorMsg=", response);
    const error = new Error("服务器异常") as IError;
    error.tag = "custom";
    error.response = response;
    throw error;
  }
}

function parseJSON(response:any) {
  return response.json();
}

/**
 *
 * @param url
 * @param options
 * @param overDueTime
 * @param isSilent
 * @param isAppReq
 * @returns {Promise<any>}
 */

export default function request( url: string, reqParams: IReuqest) {
  // isAppReq = hxAppHelper.isStarfish()
  let { options, overDueTime,  isSilent, isAppReq = true } = reqParams;
  console.log('request========params', reqParams)
  //jsbridge调取最大时长3s
  let overdue_promise = new Promise(function (resolve, reject) {
    setTimeout(() => {
      const error = new Error("请在海心抗癌app内打开") as IError;
      error.tag = "custom";
      error.code = "NOTHAIXIN_ERROR";
      reject(error);
    }, 3000); //jsbridge最大读取时间3s
  });
  let jsBridge_promise = new Promise(function (resolve, reject) {
    let _options = { credentials: "include", ...options };
    if (isAppReq) {
      //需要在app内请求
      hxAppHelper.reqHeader((res:any) => {
        let headers = _options.headers || {};
        res = res || {};
        _options.headers = { ...headers, ...res };
        if (!_options.method || _options.method === "GET") {
          //参数加参
          let params = getUrlParam(url || "") || {};
          hxAppHelper.signParamsProcess(params, (res:any) => {
            url = url.split("?")[0];
            resolve({
              url: createURL(url, res || {}),
              options: _options,
              overDueTime,
              isSilent,
              isAppReq,
            });
          });
        } else {
          resolve({
            url: url,
            options: _options,
            overDueTime,
            isSilent,
            isAppReq,
          });
        }
      });
    } else {
      //可以在app外部请求
      resolve({ url: url, options: _options, overDueTime, isSilent, isAppReq });
    }
  });

  return Promise.race([overdue_promise, jsBridge_promise])
  // @ts-ignore
    .then(baseFetch)
    .then(checkStatus)
    .then(parseJSON)
    .then((data) => {
      return getData(data, isSilent!, isAppReq);
    })
    .catch((err) => {
      console.log(err);
      !isSilent &&
        Toast.fail(err.tag === "custom" ? err.message : "网络开小差了");
      return {
        data: null,
        msg: err.message || "网络开小差了",
        code: err.code || "NET_ERROR",
        success: false,
      }; //catch 为then的语法糖,详见https://segmentfault.com/a/1190000015561508?utm_source=tag-newest,默认不写return即返回undefined,继续执行下面的then
    });
}
