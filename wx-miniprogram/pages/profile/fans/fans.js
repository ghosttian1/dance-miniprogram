// pages/profile/fans/fans.js
import mcp from '../../../utils/mcp'
import constants from '../../../utils/const'
import wxNotificationCenter from '../../../libs/WxNotificationCenter/WxNotificationCenter'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    list: [],
    params: {
      pageSize: 20,
      tailFlag: 0
    },
    hasNext: false,
    isSelf: false,
    requesting: false,
    end: false,
    enableBackToTop: false,
    refreshSize: 90,
    topSize: 0,
    bottomSize: 180,
    color: '#f1f1f1'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.registeNotification()

    const targetUserId = options.userId
    this.data.params.targetUserId = targetUserId
    this.getList(true)
  },

  /**
   * 响应广播事件
   * @param {*} data
   * @param {*} data2
   */
  onNotification: function(data, topic) {
    // 根据业务类型（关注/取关），进行不同的数据刷新操作
    if (topic === constants.notification.follow || topic === constants.notification.unfollow) {
      // 遍历推荐与关注数据，定位到匹配的视频作者上，覆写其关注状态(followStatus)
      this.data.list.forEach(item => {
        if (item.userId === data.userId) {
          item.followStatus = data.followStatus
        }
      })
      this.setData({
        list: this.data.list
      })
    }
  },

  registeNotification() {
    // 增加注册消息
    wxNotificationCenter.addNotification(constants.notification.follow, this.onNotification, this)
    wxNotificationCenter.addNotification(constants.notification.unfollow, this.onNotification, this)
  },

  unregisteNotification() {
    // console.log('fans onUnload')
    // 取消注册消息
    wxNotificationCenter.removeNotification(constants.notification.follow, this)
    wxNotificationCenter.removeNotification(constants.notification.unfollow, this)
  },

  getList(refresh) {
    if (refresh) {
      this.setData({
        'params.tailFlag': 0,
        hasNext: false
      })
    }
    this.setData({
      requesting: true
    })
    mcp('sns.fans', this.data.params).then(res => {
      if (refresh) {
        // 刷新请求，直接覆盖原列表数据即可
        this.setData({
          'list': res.data.dataList,
          'params.tailFlag': res.data.tailFlag,
          'params.pageSize': res.data.pageSize,
          'hasNext': res.data.hasNext,
          'requesting': false
        })
      } else {
        // 获取更多的数据，需要在历史dataList下添加数据集
        let list = this.data.list
        list = list.concat(res.data.dataList)
        this.setData({
          'list': list,
          'params.tailFlag': res.data.tailFlag,
          'params.pageSize': res.data.pageSize,
          'hasNext': res.data.hasNext,
          'requesting': false
        })
      }
      this.setData({
        end: !this.data.hasNext
      })
    })
  },

  unfollow(e) {
    const userId = e.target.dataset.id
    const index = e.target.dataset.index
    // console.log('==========fan unfollow', e.target.dataset)
    // console.log('==========fan unfollow userid', userId)
    if (!userId) {
      return
    }
    mcp('sns.follow', {
      followType: 'unfollow',
      targetUserId: userId
    }).then(res => {
      // console.log('fan  this.data.list', userId, res.data, this.data.list)
      this.data.list[index].followStatus = res.data.followStatus
      // this.data.list[index].followStatus = 0
      this.setData({
        list: this.data.list
      })
      // 发送广播，数据为response数据（粉丝书）
      wxNotificationCenter.postNotificationName(constants.notification.unfollow, res.data)
      // console.log('====fans resData=', res.data)
      wx.showToast({
        title: '取消成功'
      })
    })
  },

  follow(e) {
    const userId = e.target.dataset.id
    const index = e.target.dataset.index
    // console.log('==========fan follow', e.target.dataset)
    // console.log('==========fan follow userid', userId)

    if (!userId) {
      return
    }

    mcp('sns.follow', {
      followType: 'follow',
      targetUserId: userId
    }).then(res => {
      console.log('fan  this.data.list', userId, res.data, this.data.list)

      this.data.list[index].followStatus = res.data.followStatus
      this.setData({
        list: this.data.list
      })
      wxNotificationCenter.postNotificationName(constants.notification.follow, res.data)
      wx.showToast({
        title: '关注成功'
      })
    }).catch(err => {
      wx.showToast({
        title: err.errorMessage,
        icon: 'none',
        duration: 1500
      })
    })
  },

  /**
  * 生命周期函数--监听页面卸载
  */
  onUnload: function() {
    this.unregisteNotification()
  },
  // 刷新数据
  refresh() {
    this.getList(true)
  },
  // 加载更多
  more() {
    if (this.data.hasNext) {
      this.getList(false)
    }
  }

})
