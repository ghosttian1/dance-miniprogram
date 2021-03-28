// index.js
// 获取应用实例
import mcpRequest from '../../utils/mcp'
import constants from '../../utils/const'
import wxNotificationCenter from '../../libs/WxNotificationCenter/WxNotificationCenter'

const app = getApp()

Page({
  data: {

    // 分享开关
    shareEnable: true,
    // 当前页面是否自定义分享内容（且需要自行实现onShareAppMessage方法）
    isOverShare: true,
    shareData: null,

    PageCur: '',
    infoTab: 'dance',
    StatusBar: app.globalData.StatusBar,
    CustomBar: app.globalData.CustomBar,
    userInfo: {},
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    unreadMsgAmount: 0,
    configStatus: null
  },

  /**
   * 响应广播事件
   * @param {*} data
   * @param {*} data2
   */
  onNotification: function(data, topic) {
    // console.log("===index onNotification===", data);
    if (topic === constants.notification.readMessage) {
      // console.log('===index onNotification===', this)
      // 重新加载未读消息数
      this.loadUnreadMsgAmount()
    }
  },

  // 生命周期
  onLoad: function(options) {
    // 增加注册消息
    wxNotificationCenter.addNotification(constants.notification.login, this.onNotification, this)
    wxNotificationCenter.addNotification(constants.notification.readMessage, this.onNotification, this)

    // wxNotificationCenter.addNotification(constants.notification.follow, this.onNotification, this);
    // wxNotificationCenter.addNotification(constants.notification.unfollow, this.onNotification, this);
    // wxNotificationCenter.addNotification(constants.notification.like, this.onNotification, this);
    // wxNotificationCenter.addNotification(constants.notification.unlike, this.onNotification, this);

    // wxNotificationCenter.postNotificationName(constants.notification.login, "login");
    // wxNotificationCenter.postNotificationName(constants.notification.like, "like");

    // console.log("====index options===", options);
    // 切换到对应的tab上
    app.globalData.configPromise.then(res => {
      // 设置用户信息
      if (app.globalData.userInfo) {
        this.setData({
          userInfo: app.globalData.userInfo
        })
      }

      let redirectUrl = options.redirectUrl
      if (redirectUrl) {
        redirectUrl = decodeURIComponent(redirectUrl)
        // console.log("===redirectUrl===", redirectUrl);
        // TODO 校验redirectUrl的合法性
        wx.navigateTo({
          url: redirectUrl
        })
        this.setData({
          options: options
        })
      } else if (options && options.tab) {
        this.setData({
          PageCur: options.tab || 'dance',
          infoTab: options.info || 'dance'
        })
      } else {
        this.setData({
          PageCur: 'dance'
        })
      }
      this.setData({
        configStatus: true,
        pageConfig: app.globalData.pageConfig
      })
      this.getComponent()
    }).catch(() => {
      this.setData({
        configStatus: false
      })
    })
  },
  onShow() {
    this.setData({
      userInfo: app.globalData.userInfo
    })

    if (this.data.options) {
      if (this.data.options.tab) {
        this.setData({
          PageCur: this.data.options.tab || 'dance',
          infoTab: this.data.options.info || 'dance'
        })
      } else {
        this.setData({
          PageCur: 'dance'
        })
      }
      this.data.options = null
    }

    if (app.globalData.hasLogin) {
      // 已登录用户，需要获取未读消息数
      this.loopMsgBadge()
    }
  },

  /**
   *
   */
  onHide() {
    // console.log('==onHide==')
    if (this.data.intervalId) {
      clearInterval(this.data.intervalId)
    }
  },

  /**
   *
   */
  onUnload() {
    wxNotificationCenter.removeNotification(constants.notification.login, this)
  },
  getComponent() {
    this.dance = this.selectComponent('#dance')
    this.info = this.selectComponent('#info')
    this.message = this.selectComponent('#message')
    this.profile = this.selectComponent('#profile')
  },

  // 切换底部tab
  NavChange(e) {
    if (this.data.configStatus) {
      const cur = e.currentTarget.dataset.cur

      if (cur === 'message') {
        // 处于消息tab时禁用分享。做法不高级，感觉有些low
        wx.hideShareMenu({
          menus: ['shareAppMessage', 'shareTimeline']
        })
      } else {
        wx.showShareMenu({
          menus: ['shareAppMessage', 'shareTimeline']
        })
      }

      if ((cur === 'message' || cur === 'profile') && !app.globalData.hasLogin) {
        wx.navigateTo({
          url: '/pages/login/login'
        })
        return
      }
      this.setData({
        PageCur: cur
      })
      this.getComponent()
      if (cur === 'info') {
        this.info.setScrollTop()
      }
    }
  },

  // 触摸开始时间
  touchStartTime: 0,
  // 触摸结束时间
  touchEndTime: 0,
  // 最后一次单击事件点击发生时间
  lastTapTime: 0,
  // / 按钮触摸开始触发的事件
  touchStart: function(e) {
    this.touchStartTime = e.timeStamp
  },

  // / 按钮触摸结束触发的事件
  touchEnd: function(e) {
    this.touchEndTime = e.timeStamp
  },
  // 舞圈双击 单机
  multipleTap: function(e) {
    if (!this.data.configStatus) {
      return
    }
    //  从别的tab切回来
    if (this.data.PageCur !== 'dance') {
      this.setData({
        PageCur: 'dance'
      })
      this.getComponent()
      return
    }
    // 只有在dance tab 点击和 双击有用
    // 控制点击事件在350ms内触发，加这层判断是为了防止长按时会触发点击事件
    if (this.touchEndTime - this.touchStartTime < 350) {
      // 当前点击的时间
      var currentTime = e.timeStamp
      var lastTapTime = this.lastTapTime
      // 更新最后一次点击时间
      this.lastTapTime = currentTime

      // 如果两次点击时间在300毫秒内，则认为是双击事件
      if (currentTime - lastTapTime < 300) {
        // console.log('double tap')
        // 成功触发双击事件时，取消单击事件的执行
        this.dance.refreshList()
      }
    }
  },

  // 上拉加载
  onReachBottom: function() {
    const value = this.data.PageCur
    if (this[value].onReachEnd) {
      this[value].onReachEnd()
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    const value = this.data.PageCur
    if (this[value].onReachTop) {
      this[value].onReachTop()
    }
  },

  /**
   * 定时获取未读消息数
   */
  loopMsgBadge: function() {
    // 先加载一次
    this.loadUnreadMsgAmount()
    // 再定时加载
    this.data.intervalId = setInterval(this.loadUnreadMsgAmount, 60 * 1000)
  },

  loadUnreadMsgAmount: function() {
    mcpRequest('message.unreadAmount').then(res => {
      this.setData({
        unreadMsgAmount: res.data
      })
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {
    const tab = this.data.PageCur
    let compShareData = null
    switch (tab) {
      case 'dance':
        compShareData = this.dance.data.shareData
        // 分享计数
        if (this.dance.data.currentUgcId) {
          const ugcId = this.dance.data.currentUgcId
          const reportShareParam = {
            ugcId: ugcId
          }
          mcpRequest('ugc.share', reportShareParam).then(res => {
            // 分享成功后，将分享数据立刻回显示到组件的ugc项中
            this.dance.setShareCount(ugcId, res)
          }).catch((err) => {
            console.log('==share err===', err)
          })
        }

        break
      case 'info':
        compShareData = this.info.data.shareData
        break
      case 'message':
        // message的分享功能，其实在上面已被禁用了
        break
      case 'profile':
        compShareData = this.profile.data.shareData
        break
    }
    // console.log(this.profile)
    const result = compShareData || app.globalData.defaultShareData
    // console.log("===result====", result, app.globalData.defaultShareData);
    return result
  },
  onPageScroll(res) {
    if (this.data.PageCur === 'info') {
      const obj = this.info.data
      obj.scrollTop[obj.TabCur] = res.scrollTop
    }
  }

})
