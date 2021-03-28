import config from './config'
import md5 from './md5'
import request from './request'

// const app = wx.getApp()
/**
 * mcp 认证
 */
export default function mcpRequest(command, data = {}) {
  let url = config.api
  url = url + "?cmd=" + command;
  const obj = mcpFormData(command, data)
  return request.post(url, obj)
}
export function mcpFormData(command, data = {}) {
  let res = {}
  try {
    res = wx.getSystemInfoSync()
  } catch (error) { console.log(error) }

  let token = ''
  token = config.token

  const clientInfo = {
    'accessInfo': config.accessInfo,
    'deviceInfo': {
      'osType': res.system, // android, iOS
      'osVersion': res.system, // 操作系统版本
      'network': res.wifiEnabled ? 'WIFI' : 'MONET', // 客户端当前网络类型 ：WIFI, MONET 代表 4G, UNKNOWN 代表未知
      'screenWidth': res.screenWidth, // 客户端屏幕宽度
      'screenHeight': res.screenHeight, // 客户端屏幕高度
      'deviceId': '', // 客户端唯一 id, 尽可能传入
      'deviceName': `${res.brand} ${res.model}` // 客户端名称
    }
  }

  const obj = {
    c_data: JSON.stringify(data),
    c_command: command,
    c_format: 'JSON',
    c_gz: 'compression',
    c_charset: 'utf-8',
    c_version: '1.0',
    c_timestamp: Date.now(),
    c_sign_type: 'MD5',
    c_token: token,
    c_sig: '',
    c_clientinfo: JSON.stringify(clientInfo)
  }

  // 签名计算sig
  const arr = Object.keys(obj).sort()
  arr.splice(arr.indexOf('c_sig'), 1)
  let sig = ''
  for (let i = 0; i < arr.length; i++) {
    if (i === arr.length - 1) {
      sig += arr[i] + '=' + obj[arr[i]]
    } else {
      sig += arr[i] + '=' + obj[arr[i]] + '&'
    }
  }
  sig += config.secretKey
  obj.c_sig = md5(sig)
  return obj
}
