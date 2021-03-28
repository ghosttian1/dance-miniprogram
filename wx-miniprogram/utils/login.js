import mcpRequest from './mcp'
const app = getApp()

export default function login() {
  mcpRequest('account.mockLogin', {
    'loginUserId': 1
  }).then(res => {
    // 存储token
    wx.setStorageSync('token', res.data)
    // 更新当前登录用户对象, TODO 收敛
    app.globalData.userInfo = res.currentUserInfo
    app.globalData.hasLogin = !!res.currentUser
  })
}

export function wxLogin(e) {
  // console.log(e)
  let userinfo
  let encryptedData
  let iv
  let signature
  let data
  // data 发送给后端进行签名验证
  data = e.detail.data
  encryptedData = e.detail.encryptedData
  iv = e.detail.iv
  signature = e.detail.signature
  userinfo = e.detail.userInfo
  return getCode().then(res => {
    return mcpRequest('', {
      code: res.code, // 授权code
      userinfoData: {
        data: data,
        encryptedData,
        iv,
        signature,
        userinfo
      }
    })
  })
}

export function getCode() {
  return new Promise((resolve, reject) => {
    wx.login({
      success(res) {
        if (res.code) {
          // 服务器发送 code
          // console.log('code res', res)
          resolve(res)
        } else {
          reject(res)
        }
      },
      fail(err) {
        reject(err)
      }
    })
  })
}
