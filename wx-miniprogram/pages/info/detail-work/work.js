// pages/info/detail-work/work.js
import mcpRequest from '../../../utils/mcp'
import { getShareConfig, shareRedirect } from '../../../utils/share'
import constants from '../../../utils/const'
import wxNotificationCenter from '../../../libs/WxNotificationCenter/WxNotificationCenter'
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 分享开关
    shareEnable: true,
    // 当前页面是否自定义分享内容（且需要自行实现onShareAppMessage方法）
    isOverShare: true,
    shareData: null,
    options: {}
  },
  /**
     * 响应广播事件
     * @param {*} data
     * @param {*} data2
     */
  onNotification: function (data, topic, that) {
    // 根据业务类型（关注/取关），进行不同的数据刷新操作
    that.loadInfo()
  },

  registerNotification() {
    // 增加注册消息
    wxNotificationCenter.addNotification(constants.notification.login, this.onNotification, this)
  },

  unregisterNotification() {
    // 取消注册消息
    wxNotificationCenter.removeNotification(constants.notification.login, this)
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.registerNotification()
    this.setData({
      options: options
    })
    this.loadInfo()

    // 获取分享配置
    this.loadShareConfig(options.id)
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  },

  // 加载信息
  loadInfo() {
    const options = this.data.options
    const id = options.id
    mcpRequest('comment.recruit.info', { id }).then(res => {
      this.setData({
        commentRecruit: res.data.commentRecruit,
        userInfo: res.data.userProfile.userinfo,
        snsProfile: res.data.snsProfile,
        enableRefresh: res.data.enableRefresh
      })
    })
  },

  /**
  * 加载分享配置
  * @param {} id
  */
  loadShareConfig(id) {
    const shareUrl = '/pages/info/detail-work/work?id=' + id
    getShareConfig({
      type: 60,
      id: id
    }, shareUrl, "/pages/info/home/home").then(res => {
      this.setData({
        shareData: res.data
      })
    })
  },

  // 刷新内容
  refresh() {
    mcpRequest('comment.recruit.refresh', {
      id: this.data.options.id
    }).then(res => {
      wx.showToast({
        title: '刷新成功',
        icon: 'success'
      })
      this.setData({
        enableRefresh: false
      })
    }).catch(() => {
      wx.showToast({
        title: '刷新失败',
        icon: 'none'
      })
    })
  },

  goToChat() {
    if (app.globalData.hasLogin) {
      wx.navigateTo({
        url: `/pages/message/chat/chat?targetUserId=${this.data.userInfo.userId}`
      })
    } else {
      wx.navigateTo({
        url: `/pages/login/login`
      })
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    this.unregisterNotification()
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
  * 用户点击右上角分享
  */
  onShareAppMessage: function () {
    return this.data.shareData ? this.data.shareData : app.globalData.defaultShareData
  }
})

