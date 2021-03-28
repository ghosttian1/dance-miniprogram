
import {isObject} from './util'
/**
 * 支持调用方式为
 * 
 * 
 * request(url)
 * request(url,data)
 * request({url,data})
 * request.get(url)
 * request.get(url,data)
 * request.get({url,data})
 * request.post(url)
 * request.post(url,data)
 * request.post({url,data})
 * 
 */
function requestSub(method = "GET"){
  return function(url,data){
    // 参数为空
    if(url === undefined){
      return Promise.reject('参数不能为空！')
    }

    let params = {method}
    params.header = {"Content-Type": "application/x-www-form-urlencoded"}
    if(typeof url === 'string'){
      params.url = url
      data !== undefined ? params.data = data : ''
    }
    // 第一个参数为Object  后续参数不处理
    if(isObject(url)){
      Object.assign(params,url)
    }
    return sendRequest(params)
  }
}

function sendRequest(obj){
  return new Promise( (resolve,reject) => {
    wx.request({
      ...obj,
      success: wxResponse => {
        let {errorCode} = wxResponse.data  
        if(errorCode === 0){
            resolve(wxResponse.data)
        }else if(errorCode === 100){
          // 未登录
          wx.navigateTo({
            url: '/pages/login/login'
          });
          // reject(wxResponse.data)
        }else{
            reject(wxResponse.data)
        }
      },
      fail: err =>{
        reject(err)
      }
    })
  })
}

let request = requestSub('GET')
request.post  = requestSub('POST')
request.get  = requestSub('GET')

module.exports = request