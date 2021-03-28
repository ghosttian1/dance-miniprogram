import mcpRequest from './utils/mcp'
import config from './utils/config'
import constants from './utils/const'
import wxNotificationCenter from './libs/WxNotificationCenter/WxNotificationCenter'
// app.js

App({
  onLaunch: function () {
    // 全局设置分享语
    this.overShare()

    // 查看token  存储token
    try {
      config.token = wx.getStorageSync('token')
    } catch (err) {
      console.log(err)
    }
    wx.showLoading({
      mask: true
    })

    try {
      var value = wx.getStorageSync('currentCity')
      if (value) {
        this.globalData.currentCity = value
      }
    } catch (e) {
      // Do something when catch error
    }

    // 请求基础配置
    this.globalData.configPromise = new Promise((resolve, reject) => {
      mcpRequest('config').then(res => {
        wx.hideLoading()
        this.globalData.userInfo = res.currentUser && res.currentUser.userinfo || {}
        this.globalData.userBanInfo = res.currentUser && res.currentUser.userBanInfo || {}
        this.globalData.hasLogin = !!res.currentUser
        this.globalData.pageConfig = res.data && res.data.config || {}

        if (this.globalData.hasLogin) {
          // 已登录用户，需要获取未读消息数
          this.loopMsgBadge()
        }
        if (this.globalData.pageConfig.comment === 'true') {
          this.globalData.tabBarList.splice(1, 0, {
            iconPath: '/images/tabbar/quan.png',
            activePath: '/images/tabbar/quan_cur.png',
            text: '舞圈',
            style: 'padding:8rpx;',
            name: 'info'
          })
        }
        resolve()
      }).catch(() => {
        wx.showToast({
          title: '请求错误',
          icon: 'none'
        })
        reject()
      })
    })

    // 获取城市列表
    mcpRequest('info.citys').then(res => {
      this.globalData.city = res.data
    })

    // wxLogin()

    // mcpRequest('sns.follows', { targetUserId: 1, pageNo: 10, tailFlag: 0 }).then(res => {
    // })
    // 登录
    // wx.login({
    //   success: res => {
    //     // 发送 res.code 到后台换取 openId, sessionKey, unionId
    //   }
    // })
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.wxUserInfo = res.userInfo

              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })
    // 获取系统状态栏信息
    wx.getSystemInfo({
      success: e => {
        // 状态栏高度
        this.globalData.StatusBar = e.statusBarHeight
        const capsule = wx.getMenuButtonBoundingClientRect()
        if (capsule && capsule.bottom) {
          this.globalData.Custom = capsule
          this.globalData.CustomBar = capsule.bottom + capsule.top - e.statusBarHeight
        } else {
          this.globalData.CustomBar = e.statusBarHeight + 50
        }
      }
    })

    // 增加注册消息
    wxNotificationCenter.addNotification(constants.notification.readMessage, this.onNotification, this)
  },

  onNotification: function (data, topic) {
    if (topic === constants.notification.readMessage) {
      // 重新加载未读消息数
      this.loadUnreadMsgAmount()
    }
  },

  /**
   * 定时获取未读消息数
   */
  loopMsgBadge: function () {
    // 先加载一次
    this.loadUnreadMsgAmount()
    // 再定时加载
    this.intervalId = setInterval(this.loadUnreadMsgAmount, 60 * 1000)
  },

  loadUnreadMsgAmount: function () {
    mcpRequest('message.unreadAmount').then(res => {
      this.globalData.unreadMsgAmount = res.data
      wxNotificationCenter.postNotificationName(constants.notification.messageText, res.data)
    })
  },

  /**
   * 处理全局分享(类似切面方式，暂时留存，用于以后重构使用)
   * usage:
   * 默认关闭分享功能。如需开启，需要在各页面中，设置data.shareEnable=true;
   * 如需自定义分享内容，需要在各页面中，设置data.isOverShare=true，且复写onShareAppMessage方法。
   *
   */
  overShare: function () {
    // 监听路由切换
    wx.onAppRoute(function (res) {
      // get加载的页面
      const pages = getCurrentPages()
      // 获取当前页面的对象
      const view = pages[pages.length - 1]
      let data
      if (view) {
        data = view.data
        // console.log('是否重写分享方法', data.isOverShare, data.shareEnable);

        if (data.shareEnable) {
          // 页面中开启分享（默认禁用分享，需单独开启）
          wx.showShareMenu({
            menus: ['shareAppMessage', 'shareTimeline']
          })
        } else {
          // 页面中禁用分享
          wx.hideShareMenu({
            menus: ['shareAppMessage', 'shareTimeline']
          })
        }

        if (!data.isOverShare) {
          data.isOverShare = true
          // console.log('==重写分享方法==', data.isOverShare);
          view.onShareAppMessage = function () {
            // 默认分享配置
            return this.globalData.defaultShareData
          }
        }
      }
    })
  },

  globalData: {
    // systemInfo: wx.getSystemInfoSync(),
    unreadMsgAmount: 0,
    version: config.accessInfo.clientVersionName,
    /** 默认分享内容 */
    /** 官方文档：https://developers.weixin.qq.com/miniprogram/dev/reference/api/Page.html#onShareAppMessage-Object-object */
    defaultShareData: {
      title: '舞圈短视频',
      path: '/pages/dance/main/main',
      imageUrl: 'https://res.dance798.com/share/share_1.jpg'
    },
    configPromise: null,
    // 用户禁止信息
    userBanInfo: {},
    // 用户信息
    userInfo: {},
    hasLogin: false,
    // 状态栏高度
    StatusBar: null,
    // 自定义高度
    CustomBar: null,
    currentCity: {
      city: '全国',
      code: ''
    },
    tabBarList: [
      {
        iconPath: '/images/tabbar/home.png',
        activePath: '/images/tabbar/home_cur.png',
        text: '首页',
        style: 'padding:4rpx',
        name: 'dance'
      },

      {
        iconPath: '/images/tabbar/message.png',
        activePath: '/images/tabbar/message_cur.png',
        text: '消息',
        style: 'padding:4rpx;',
        name: 'message'
      },
      {
        iconPath: '/images/tabbar/about.png',
        activePath: '/images/tabbar/about_cur.png',
        text: '我',
        style: '',
        name: 'profile'
      }
    ],
    // 页面config 信息
    pageConfig: {

    },
    // 默认首页视频显示 来回切换之后 需要根据这个显示
    danceTab: 'tui',
    // 工作方向、
    workDirection: [{
      text: '全职拉丁',
      code: 1041
    }, {
      text: '兼职拉丁',
      code: 1042
    }, {
      text: '全职摩登',
      code: 1043
    }, {
      text: '兼职摩登',
      code: 1044
    }, {
      text: '代课',
      code: 1045
    }],
    // 赛服类型
    clothesType: [{
      text: '拉丁',
      code: 1001
    }, {
      text: '摩登',
      code: 1002
    }, {
      text: '其他',
      code: 1003
    }],
    // 水平
    level: [{
      text: '专业',
      code: 1021
    }, {
      text: '业余',
      code: 1022
    }],
    // 专业id
    major: [{
      text: '拉丁',
      code: 1001
    }, {
      text: '摩登',
      code: 1002
    }, {
      text: '十项全能',
      code: 1004
    }],
    // 性别
    gender: [{
      text: '男',
      code: 1
    }, {
      text: '女',
      code: 2
    }]
  }
})
