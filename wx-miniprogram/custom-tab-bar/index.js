// custom-tab-bar/index.js
import constants from '../utils/const'
import wxNotificationCenter from '../libs/WxNotificationCenter/WxNotificationCenter'
const app = getApp()

Component({
  options: {
    addGlobalClass: true
  },
  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {
    active: 'dance',
    configStatus: false,
    pageConfig: {},
    unreadMsgAmount: 0,
    list: []
  },
  attached() {
    wxNotificationCenter.addNotification(constants.notification.messageText, this.onNotification, this)
    app.globalData.configPromise.then(res => {
      this.setData({
        list: app.globalData.tabBarList,
        configStatus: true,
        pageConfig: app.globalData.pageConfig,
        unreadMsgAmount: app.globalData.unreadMsgAmount
      })
    }).catch(() => {
      this.setData({
        configStatus: false
      })
    })
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 切换tab
    switchTab(e) {
      const tab = e.currentTarget.dataset.name
      const obj = {
        dance: '/pages/dance/main/main',
        info: '/pages/info/home/home',
        message: '/pages/message/home/home',
        profile: '/pages/profile/myhome/myhome'
      }
      if ((tab === 'message' || tab === 'profile') && !app.globalData.hasLogin) {
        wx.navigateTo({
          url: '/pages/login/login'
        })
      } else {
        this.setData({
          active: tab
        })
        wx.switchTab({
          url: obj[tab]
        })
      }
    },

    // 触摸开始时间
    touchStartTime: 0,
    // 触摸结束时间
    touchEndTime: 0,
    // 最后一次单击事件点击发生时间
    lastTapTime: 0,
    // / 按钮触摸开始触发的事件
    touchStart: function (e) {
      this.touchStartTime = e.timeStamp
    },

    // / 按钮触摸结束触发的事件
    touchEnd: function (e) {
      this.touchEndTime = e.timeStamp
    },
    // 舞圈双击 单机
    tap: function (e) {
      if (!this.data.configStatus) {
        return
      }
      //  当前tab不在dance
      if (this.data.active !== 'dance') {
        this.switchTab(e)
        return
      } else if (this.data.active === 'dance' && e.currentTarget.dataset.name !== 'dance') {
        this.switchTab(e)
        return
      }
      // // 只有在dance tab 点击和 双击有用
      // // 控制点击事件在35 0ms内触发，加这层判断是为了防止长按时会触发点击事件
      // if (this.touchEndTime - this.touchStartTime < 350) {
      //   // 当前点击的时间
      //   var currentTime = e.timeStamp
      //   var lastTapTime = this.lastTapTime
      //   // 更新最后一次点击时间
      //   this.lastTapTime = currentTime

      //   // 如果两次点击时间在300毫秒内，则认为是双击事件
      //   if (currentTime - lastTapTime < 300) {
      console.log('single tap')
      wxNotificationCenter.postNotificationName(constants.notification.doubleTap)
      // 成功触发双击事件时，取消单击事件的执行
      //   }
      // }
    },

    /**
   * 响应广播事件
   * @param {*} data
   * @param {*} data2
   */
    onNotification: function (data, topic, that) {
      if (topic === constants.notification.messageText) {
        // 重新加载未读消息数
        that.setData({
          unreadMsgAmount: data
        })
      }
    }
  }
})
