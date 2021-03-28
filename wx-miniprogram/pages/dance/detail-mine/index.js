// pages/dance/detail-mine/index.js
import mcpRequest from '../../../utils/mcp'
import { getShareConfig, shareRedirect } from '../../../utils/share'
import constants from '../../../utils/const'

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

    id: '',
    item: {},
    videoPause: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const id = options.id || 100046
    // 需要在此设置 global   直接在data中赋值   数据不是最新的
    this.setData({
      StatusBar: app.globalData.StatusBar,
      CustomBar: app.globalData.CustomBar,
      windowHeight: wx.getSystemInfoSync().windowHeight,
      id: id
    })
    this.getUgcInfo(id)
  },

  getUgcInfo(id) {
    mcpRequest('ugc.detail', { ugcId: id }).then(res => {
      this.setData({
        item: res.data
      })

      let item = this.data.item;
      let title = "视频无法播放";
      if (item.status == -1) {
        title = "视频已被删除";
      } else if (item.status == 10 || item.status == 20) {
        title = "视频审核中";
      } else if (item.status == 30) {
        title = "视频审核不通过";
      } else if (item.status == 50) {
        title = "视频已被封禁";
      }
      if (this.data.item.status != 40) {
        wx.showToast({
          title: title,
          icon: "none",
          duration: 2500,
        })
      }



      if (res.data.status === constants.ugc.status_published) {
        this.loadShareConfig(id, this.data.item.userId)
      } else {
        // 未发布，页面中禁用分享
        wx.hideShareMenu({
          menus: ['shareAppMessage', 'shareTimeline']
        })
      }
    })
  },

  // 暂停播放操作
  playStop() {
    if (!this.data.videoCtx) {
      this.data.videoCtx = wx.createVideoContext('video', this)
    }
    if (this.data.videoPause) {
      this.data.videoCtx.play()
      this.data.videoPause = false
    } else {
      this.data.videoCtx.pause()
      this.data.videoPause = true
    }
    this.setData({
      videoPause: this.data.videoPause
    })
  },

  deleteInfo() {
    wx.showModal({
      title: '删除',
      content: '确认删除该条内容吗？',
      success: res => {
        if (res.confirm) {
          // 删除
          wx.showLoading({
            title: '删除数据'
          })
          mcpRequest('ugc.delete', { ugcId: this.data.id }).then(res => {
            wx.hideLoading()
            wx.navigateBack({
              delta: 1
            })
          })
        }
      }

    })
  },

  // 点赞ugc
  likeOrUnlike(e) {
    if (!app.globalData.hasLogin) {
      // 未登录
      wx.navigateTo({
        url: '/pages/login/login'
      })
      return
    }
    const hasLike = e.currentTarget.dataset.haslike
    const ugcId = e.currentTarget.dataset.ugcid
    const data = {
      likeType: hasLike ? 'unlike' : 'like',
      ugcId
    }
    mcpRequest('ugc.like', data).then(res => {
      wx.showToast({
        title: hasLike ? '已取消点赞' : '点赞成功',
        icon: 'none'
      })
      const item = this.data.item
      item.interactiveInfo.hasLike = res.data.hasLike
      item.interactiveInfo.likeAmount = res.data.likeAmount
      item.interactiveInfo.likeAmountText = res.data.likeAmountText
      this.setData({
        item: item
      })
    }).catch(err => {
      wx.showToast({
        title: err && err.errorMessage || '请求错误',
        icon: 'none'
      })
    })
  },

  /**
     * 加载分享配置， TODO 调用时机
     * @param {} id
     */
  loadShareConfig(id, targetUserId) {
    let shareUrl = '/pages/dance/detail/index?ugcId=' + id + '&targetUserId=' + targetUserId
    shareUrl = shareUrl + '&type=20'
    getShareConfig({
      type: 20,
      id: id
    }, shareUrl).then(res => {
      this.setData({
        shareData: res.data
      })
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    // let that = this;
    const ugcId = this.data.id
    console.log('ugcId', ugcId)
    const reportShareParam = {
      ugcId: ugcId
    }
    mcpRequest('ugc.share', reportShareParam).then(res => {
      // 分享成功后，将分享数据立刻回显示到组件的ugc项中
      this.data.item.interactiveInfo.shareAmount = res.data.shareAmount
      this.data.item.interactiveInfo.shareAmountText = res.data.shareAmountText
      this.setData(this.data)
    }).catch((err) => {
      console.log('==share err===', err)
    })
    return this.data.shareData ? this.data.shareData : app.globalData.defaultShareData
  }
})
