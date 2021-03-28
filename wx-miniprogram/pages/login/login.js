// pages/login/login.js

import mcp from '../../utils/mcp'
import config from '../../utils/config'
import constants from '../../utils/const'
import wxNotificationCenter from '../../libs/WxNotificationCenter/WxNotificationCenter'

const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 授权显示
    authShow: false
  },
  // 获取手机号
  getPhoneNumber(e) {
    const { errMsg, encryptedData, iv } = e.detail
    if (errMsg !== 'getPhoneNumber:ok') {
      // 用户拒绝
      wx.showToast({
        title: '您已取消授权操作~',
        icon: 'none'
      })
    } else {
      this.setData({
        authShow: true,
        miniProgramMobileAuthData: e.detail
      })
      // console.log("===this.data==", this.data);
    }
  },

  /**
   * login
   */
  login() {
    // 用户同意手机号授权
    const params = {
      'code': this.data.code,
      'miniProgramMobileAuthData': this.data.miniProgramMobileAuthData,
      'miniProgramAuthData': this.data.miniProgramAuthData
    }

    wx.showLoading({
      title: '登录中...'
    })
    mcp('account.mobileLogin', params).then(res => {
      if (res.errorCode === 0) {
        // 存储token
        config.token = res.data
        wx.setStorageSync('token', res.data)
        // 更新当前登录用户对象,
        app.globalData.userInfo = res.currentUser.userinfo || {}
        app.globalData.hasLogin = !!res.currentUser
        app.globalData.userBanInfo = res.currentUser && res.currentUser.userBanInfo || {}


        wxNotificationCenter.postNotificationName(constants.notification.login);
        wx.hideLoading();
        // 关闭当前登录页
        wx.navigateBack({
          delta: 1
        })
      } else {
        app.globalData.userInfo = {}
        app.globalData.hasLogin = false
        wx.hideLoading();
        wx.showToast({
          title: '登录失败',
          icon: 'none'
        })
        // 登录操作，重新获取code
        this.fetchCode()
      }
    })
  },

  // 获取用户信息
  getUserInfo(e) {
    const { errMsg } = e.detail
    if (errMsg !== 'getUserInfo:ok') {
      // 用户拒绝
      wx.showToast({
        title: '拒绝获取用户信息，部分功能不可用哦~',
        icon: 'none'
      })
    } else {
      // 用户允许
      this.setData({
        miniProgramAuthData: {
          userInfo: e.detail.userInfo
        }
      })
      this.login()
    }
  },

  /**
   * 获取微信code
   * 存在10分钟过期，以及被使用的情况，因此mcp等接口操作失败时，需要重刷一次code，避免无法调用
   */
  fetchCode() {
    wx.login({
      success: res => {
        if (res.code) {
          // 获取code成功
          this.data.code = res.code
        } else {
          wx.showToast({
            title: '登录失败',
            icon: 'none'
          })
        }
      }
    })
  },

  hideModal() {
    this.setData({
      authShow: false
    })
  },

  /**
   * 生周期函数--监听页面加载
   */
  onLoad: function (options) {
    app.globalData.hasLogin = false
    app.globalData.userInfo = {}
  },

  /**
   * 生命周期函数-监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生周期函数--监听页面显示
   */
  onShow: function () {
    // 存在sessionKey反解手机号、个人资料的问题，所以一定要先获取code
    // code只有10分钟的有效期，且可能被消费，TODO 健壮性轮询？
    //  获取code
    this.fetchCode()
  },

  /**
   * 生周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角享
   */
  onShareAppMessage: function () {

  }
})
