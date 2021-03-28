// pages/dancer/home/home.js
import mcp from '../../../utils/mcp'
import { getShareConfig, shareRedirect } from '../../../utils/share'
import constants from '../../../utils/const'
import wxNotificationCenter from '../../../libs/WxNotificationCenter/WxNotificationCenter'

const app = getApp()
Component({
  properties: {
    // 接受userId的参数
    targetUserId: Number, // 类型
    isBack: {
      type: Boolean, // bool类型
      value: false // bool类型
    }
  },

  options: {
    styleIsolation: 'apply-shared'
  },
  /**
   * 页面的初始数据
   */
  data: {
    // 当前登录人的用户对象数据
    currentUserInfo: null,
    // 查询的用户对象数据
    targetUserInfo: null,
    // 粉丝数
    fansAmountText: '0',
    // 关注数
    followsAmountText: '0',
    // 关注状态
    followStatus: -1,
    isSelf: '',
    tabCur: '0',
    // 用户发布的参数
    postedParams: {
      hasNext: true,
      tailFlag: 0,
      pageSize: 15
    },
    postedUgcList: [],
    // 用户点赞的参数
    likedParams: {
      hasNext: true,
      tailFlag: 0,
      pageSize: 15
    },
    likeList: [],
    snsDataChanged: true,
    pageConfig: {}
  },
  lifetimes: {
    ready() {
      this.ready()
    },

    attached: function () {
      // 注册通知事件
      this.registeNotification()
    },

    detached: function () {
      // 销毁广播
      this.unregisteNotification()
    }
  },
  pageLifetimes: {
    show() {
      // 只有hide之后 的show 才能执行，否则在刚打开的时候会和 ready部分 执行两次
      if (this.hide) {
        this.ready()
      }
      if (typeof this.getTabBar === 'function' &&
        this.getTabBar()) {
        this.getTabBar().setData({
          active: 'profile'
        })
      }
    },
    hide() {
      // 页面hide的时候  设置hide
      this.hide = true
    }
  },
  ready() {
    this.ready()
  },

  methods: {
    ready() {
      this.initData()
      this.setData({
        pageConfig: app.globalData.pageConfig
      })
      // 获取分享配置
      this.loadShareConfig(this.data.targetUserInfo.userId)
    },

    /**
     * 加载数据
     */
    initData() {
      // 设置当前登录用户信息
      const currentUserInfo = app.globalData.userInfo
      const isSelf = currentUserInfo.userId === this.data.targetUserId || this.data.targetUserId === 0
      const targetUserInfo = isSelf ? currentUserInfo : {
        userId: this.data.targetUserId
      }
      this.setData({
        isSelf: isSelf,
        currentUserInfo: currentUserInfo,
        targetUserInfo: targetUserInfo
      })

      // 不相同，则请求网络获取用户基本资料
      if (!isSelf) {
        mcp('user.info', { targetUserId: this.data.targetUserId }).then(res => {
          this.setData({
            targetUserInfo: res.data.userinfo
          })
        }).catch(() => {
          wx.showToast({
            title: '请求错误',
            icon: 'none'
          })
        })
      }

      // 加载社交信息（无数据变化时无需更新，但因为部分触发时机未发送事件通知，因此还是全量获取）
      if (this.data.snsDataChanged) {
        this.loadSnsData()
      }
      // 重置参数
      this.resetParams()
      // 加载我发布的ugc列表
      if (this.data.tabCur === '0') {
        this.loadUserPostedUgcList()
      } else {
        this.loadUserLikedUgcList()
      }

      // 加载用户发布的ugc个数 & 赞的个数
      this.loadUserUgcAmount()
    },

    /**
     * 响应广播事件
     * @param {*} data
     */
    onNotification(data, topic, that) {
      // console.log('===home onNotification===', data)
      // 社交关注数据有变化，需要变更状态，便于重新加载数据
      that.setData({
        snsDataChanged: true
      })
    },

    registeNotification() {
      // 增加注册消息
      wxNotificationCenter.addNotification(constants.notification.follow, this.onNotification, this)
      wxNotificationCenter.addNotification(constants.notification.unfollow, this.onNotification, this)
    },

    unregisteNotification() {
      // console.log('home onUnload')
      // 取消注册消息
      wxNotificationCenter.removeNotification(constants.notification.follow, this)
      wxNotificationCenter.removeNotification(constants.notification.unfollow, this)
    },

    /**
   * 加载分享配置
   * @param {} id
   */
    loadShareConfig(id) {
      const shareUrl = '/pages/profile/userhome/userhome?targetUserId=' + this.data.targetUserId;
      getShareConfig({
        type: 10,
        id: id
      }, shareUrl).then(res => {
        this.setData({
          shareData: res.data
        })
      })
    },

    /**
     * 加载社交信息
     */
    loadSnsData() {
      // 获取社交信息
      const reqParams = {
        targetUserId: this.data.targetUserInfo.userId
      }
      mcp('sns.summary', reqParams).then(res => {
        this.setData({
          fansAmountText: res.data.fansAmountText,
          followsAmountText: res.data.followsAmountText,
          followStatus: res.data.followStatus,
          // 数据加载完毕，设置sns数据未变更（onshow时无需重新加载）
          snsDataChanged: false
        })
      }).catch(err => {
        wx.showToast({
          title: err.errorMessage || '请求错误',
          icon: 'none'
        })
      })
    },

    /**
     * 加载用户发布的ugc列表
     */
    loadUserPostedUgcList() {
      if (!this.data.postedParams.hasNext) {
        return
      }
      // 获取我发布的ugc列表
      let reqParams = { targetUserId: this.data.targetUserInfo.userId }
      reqParams = Object.assign({}, reqParams, this.data.postedParams)
      mcp('ugc.userPostedUgcs', reqParams).then(res => {
        if (res.data) {
          this.data.postedParams.hasNext = res.data.hasNext
          this.data.postedParams.pageSize = res.data.pageSize
          this.data.postedParams.tailFlag = res.data.tailFlag
          this.data.postedUgcList = this.data.postedUgcList.concat(res.data.dataList)
          this.setData({
            postedParams: this.data.postedParams,
            postedUgcList: this.data.postedUgcList
          })
        }
      }).catch(err => {
        wx.showToast({
          title: err.errorMessage || '请求错误',
          icon: 'none'
        })
      })
    },

    /**
       * 加载用户赞过的ugc列表
       */
    loadUserLikedUgcList() {
      if (!this.data.likedParams.hasNext) {
        return
      }
      // 获取我发布的ugc列表
      let reqParams = { targetUserId: this.data.targetUserInfo.userId }
      reqParams = Object.assign({}, reqParams, this.data.likedParams)
      mcp('ugc.userLikedUgcs', reqParams).then(res => {
        if (res.data) {
          this.data.likedParams.hasNext = res.data.hasNext
          this.data.likedParams.pageSize = res.data.pageSize
          this.data.likedParams.tailFlag = res.data.tailFlag
          this.data.likeList = this.data.likeList.concat(res.data.dataList)
          this.setData({
            likeList: this.data.likeList,
            likedParams: this.data.likedParams
          })
        }
      }).catch(err => {
        wx.showToast({
          title: err.errorMessage || '请求错误',
          icon: 'none'
        })
      })
    },

    /**
    * 加载用户发布的ugc列表
    */
    loadUserUgcAmount() {
      // 获取我发布的ugc列表
      const reqParams = {
        targetUserId: this.data.targetUserInfo.userId
      }
      mcp('ugc.count', reqParams).then(res => {
        this.setData({
          likedAmount: res.data.likedAmount,
          postedAmount: res.data.postedAmount
        })
      }).catch(err => {
        wx.showToast({
          title: err.errorMessage || '请求错误',
          icon: 'none'
        })
      })
    },

    // 重置参数
    resetParams() {
      this.setData({
        // 用户发布的参数
        postedParams: {
          hasNext: true,
          tailFlag: 0,
          pageSize: 15
        },
        postedUgcList: [],
        // 用户点赞的参数
        likedParams: {
          hasNext: true,
          tailFlag: 0,
          pageSize: 15
        },
        likeList: []
      })
    },

    updateUserInfo() {
      if (this.data.isSelf) {
        wx.navigateTo({
          url: '/pages/profile/user/edit'
        })
      }
    },
    // 联系点击
    messageClick() {
      if (!app.globalData.hasLogin) {
        // 未登录
        wx.navigateTo({
          url: '/pages/login/login'
        })
        return
      }
      wx.navigateTo({
        url: '/pages/message/chat/chat?targetUserId=' + this.data.targetUserId
      })
    },
    // 关注关注
    followClick() {
      if (!app.globalData.hasLogin) {
        // 未登录
        wx.navigateTo({
          url: '/pages/login/login'
        })
        return
      }
      this.followOperate(true)
    },

    // 取消关注
    unfollowClick() {
      this.followOperate(false)
    },

    // 关注和取消关注
    followOperate(isFollow) {
      const followType = isFollow ? 'follow' : 'unfollow'
      mcp('sns.follow', {
        followType: followType,
        targetUserId: this.data.targetUserId
      }).then(res => {
        // 发送广播，数据为response数据（粉丝数）
        const topic = isFollow ? constants.notification.follow : constants.notification.unfollow
        wxNotificationCenter.postNotificationName(topic, res.data)
        const title = isFollow ? '关注成功' : '取关成功'
        wx.showToast({
          title
        })
        // 重置关注状态
        this.setData({
          // isFollow: !isFollow,
          followStatus: res.data.followStatus,
          fansAmount: res.data.fansAmount,
          fansAmountText: res.data.fansAmountText
        })
        // console.log('==this.data', this.data)
      }).catch(() => {
        wx.showToast({
          title: '请求错误',
          icon: 'none'
        })
      })
    },

    /**
     * tab切换事件
     * @param {*} e
     */
    tabSelect(e) {
      const tab = e.currentTarget.dataset.tab
      this.setData({
        tabCur: e.currentTarget.dataset.tab
      })

      if (tab === '1') {
        // 我赞的
        this.loadUserLikedUgcList()
      } else {
        // 我发布的
        this.loadUserPostedUgcList()
      }
    },

    // ugc 详情页
    goDetail(e) {
      const id = e.currentTarget.dataset.id
      const type = e.currentTarget.dataset.type
      let url = ''
      if (this.data.isSelf && type === '20') {
        url = '/pages/dance/detail-mine/index?id=' + id
      } else {
        url = '/pages/dance/detail/index?targetUserId=' + this.data.targetUserInfo.userId + '&type=' + type + '&ugcId=' + id
      }
      wx.navigateTo({
        url: url
      })
    },
    // 下拉加载更多
    onReachEnd() {
      // 加载我发布的ugc列表
      if (this.data.tabCur === '0') {
        this.loadUserPostedUgcList()
      } else {
        this.loadUserLikedUgcList()
      }
    },
    // 点击复制id
    copyID(e) {
      const id = e.currentTarget.dataset.id
      wx.setClipboardData({
        data: `${id}`,
        success(res) {
          wx.showToast({
            title: '复制成功',
            icon: 'none'
          })
        }
      })
    }
  }
})
