
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

    targetUserId: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.profile = this.selectComponent('#profile')
    this.setData({
      targetUserId: options.targetUserId
    })
  },

  /**
  * 用户点击右上角分享
  */
  onShareAppMessage: function() {
    return this.profile.data.shareData ? this.profile.data.shareData : app.globalData.defaultShareData
  },
  // 上拉加载
  onReachBottom: function() {
    if (this.profile.onReachEnd) {
      this.profile.onReachEnd()
    }
  }

})
