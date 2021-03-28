import mcpRequest from '../../../utils/mcp'
import { getShareConfig, shareRedirect } from '../../../utils/share'
import constants from '../../../utils/const'
import wxNotificationCenter from '../../../libs/WxNotificationCenter/WxNotificationCenter'

/**
 * 旧版首页，目前不再使用
 */
const app = getApp()
Component({
  options: {
    addGlobalClass: true
  },
  data: {
    StatusBar: app.globalData.StatusBar,
    CustomBar: app.globalData.CustomBar,
    windowHeight: '', // 屏幕高度
    tab: 'tui',
    // 原始 load 推荐列表
    recommendList: [],
    // 推荐video列表
    recommendVideoList: [],
    // 视频对应的用户列表
    recommendInfoList: [],
    // 推荐列表
    recommend: {
      tailFlag: 0,
      pageSize: 15,
      hasNext: true
    },
    recommendRefresh: false,
    recommendStop: false,
    // 关注列表
    followParams: {
      tailFlag: 0,
      pageSize: 15,
      hasNext: true
    },
    followList: [],
    followVideoList: [],
    followInfoList: [],
    followRefresh: false,
    followStop: false,
    // 是否显示分享提示
    shareTip: false,
    // 关注的人是否有新消息
    isNewData: false,
    // 是否强制重刷页面（登录、注销登录时需要重新刷新页面数据，重制交互等数据）
    isForceReload: true
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
    show: function () {
      // 页面被展示
      // console.log('====show==')
      this.ready()
      if (typeof this.getTabBar === 'function' &&
        this.getTabBar()) {
        this.getTabBar().setData({
          active: 'dance'
        })
      }
    }
  },

  // ready() {
  //   this.ready();
  // },

  methods: {
    ready() {
      this.setData({
        tab: app.globalData.danceTab
      })
      if (this.data.isForceReload) {
        // 重置参数
        this.resetParams('follow')
        this.resetParams('tui')
        // console.log('====isForceReload==')
        // 需要在此设置 global   直接在data中赋值   数据不是最新的
        this.setData({
          StatusBar: app.globalData.StatusBar,
          CustomBar: app.globalData.CustomBar,
          windowHeight: wx.getSystemInfoSync().windowHeight
        })
        wx.showLoading({
          title: '数据加载中'
        })
        this.getList()

        // 加载关注提示
        this.loadFollowedNotice()

        // 获取分享配置
        // this.loadShareConfig()

        // 新用户显示tip
        wx.getStorage({
          key: 'shareTip',
          fail: () => {
            this.setData({
              shareTip: true
            })
            wx.setStorage({
              key: 'shareTip',
              data: true
            })
            setTimeout(() => {
              this.setData({
                shareTip: false
              })
            }, 3 * 1000)
          }
        })
        this.data.isForceReload = false
      }
    },

    /**
     * 响应广播事件
     * @param {*} data
     */
    onNotification(data, topic, that) {
      // 关注数据有变化，需要变更状态，便于重新加载数据
      // const topic = this.name
      // console.log('on message', topic)
      if (topic === constants.notification.login || topic === constants.notification.logout) {
        that.data.isForceReload = true
      } else if (topic === constants.notification.follow || topic === constants.notification.unfollow) {
        // 遍历推荐与关注数据，定位到匹配的视频作者上，覆写其关注状态(followStatus)
        that.data.recommendInfoList.forEach(item => {
          if (item.userinfo.userId === data.userId) {
            item.userSnsInfo.followStatus = data.followStatus
          }
        })
        that.data.followInfoList.forEach(item => {
          if (item.userinfo.userId === data.userId) {
            item.userSnsInfo.followStatus = data.followStatus
          }
        })

        that.setData({
          recommendInfoList: that.data.recommendInfoList,
          followInfoList: that.data.followInfoList
        })
      }

      // let changedUserId = data.userId;
      // for(){
      //   if(item.ugcAuthorUserId == changedUserId){
      //     item.

      //   }
      // }

      // TODO 同理如果是ugc的赞操作，也要遍历数据，定位到匹配的视频上，覆写其赞的状态与数据
    },

    registeNotification() {
      // console.log('===dancehome registeNotification===')
      // 增加注册消息
      wxNotificationCenter.addNotification(constants.notification.login, this.onNotification, this)
      wxNotificationCenter.addNotification(constants.notification.logout, this.onNotification, this)
      wxNotificationCenter.addNotification(constants.notification.follow, this.onNotification, this)
      wxNotificationCenter.addNotification(constants.notification.unfollow, this.onNotification, this)
    },

    unregisteNotification() {
      // console.log('===dancehome unregisteNotification===')

      // 取消注册消息
      wxNotificationCenter.removeNotification(constants.notification.follow, this)
      wxNotificationCenter.removeNotification(constants.notification.unfollow, this)
    },

    /**
     * 加载关注ugc的提示
     */
    loadFollowedNotice() {
      mcpRequest('ugc.followedNotice', {
      }).then(res => {
        this.setData({
          isNewData: res.data
        })
      })
    },

    setShareInfo(ugcListItem) {
      this.setData({
        currentUgcId: ugcListItem.id,
        shareData: null
      })
      this.loadShareConfig(ugcListItem)
    },
    /**
    * 加载分享配置
    * @param {} id
    */
    loadShareConfig(ugcListItem) {
      // console.log(this.data)
      // 判断当前tab
      // console.log("==ugcListItem===", ugcListItem);
      const ugcId = ugcListItem.id
      const ugcUserId = ugcListItem.userinfo.userId
      let shareUrl = '/pages/dance/detail/index?ugcId=' + ugcId + '&targetUserId=' + ugcUserId
      if (this.data.tab === 'follow') {
        shareUrl = shareUrl + '&type=20'
      } else if (this.data.tab === 'tui') {
        shareUrl = shareUrl + '&type=10'
      }

      getShareConfig({
        type: 20,
        id: ugcId
      }, shareUrl).then(res => {
        // console.log("==share res data===", res.data);

        this.setData({
          shareData: res.data
        })
      })
    },

    getList() {
      if (this.data.tab === 'tui') {
        if (this.data.recommend.hasNext) {
          // TODO 多页情况下是否有bug？
          this.getDataList()
        }
      } else if (this.data.tab === 'follow') {
        if (this.data.followParams.hasNext) {
          // TODO 多页情况下是否有bug？
          this.getFollowDataList()
        }
      }
    },
    // 获取
    getDataList() {
      mcpRequest('ugc.recommend.list', this.data.recommend).then(res => {
        this.data.recommend.tailFlag = res.data.tailFlag
        this.data.recommend.hasNext = res.data.hasNext
        this.data.recommendList = this.data.recommendList.concat(res.data.dataList)
        // 组装playList
        const list = []
        const infoList = []
        res.data.dataList.forEach(item => {
          list.push({
            id: item.id,
            url: item.videoRes.resUrl,
            coverUrl: item.coverRes.resUrl
          })
          infoList.push({
            id: item.id,
            userinfo: item.userProfile.userinfo,
            interactiveInfo: item.interactiveInfo,
            userSnsInfo: item.userSnsInfo,
            content: item.content
          })
        })
        // 第一次进来 需要设置下
        if (this.data.recommendInfoList.length === 0) {
          this.setShareInfo(infoList[0])
        }

        this.setData({
          recommend: this.data.recommend,
          recommendVideoList: list,
          recommendInfoList: this.data.recommendInfoList.concat(infoList)
        })
        wx.hideLoading()
      }).catch(() => {
        wx.hideLoading()
      })
    },
    // 我关注的
    getFollowDataList() {
      mcpRequest('ugc.userFollowedUgcs', this.data.followParams).then(res => {
        this.data.followParams.tailFlag = res.data.tailFlag
        this.data.followParams.hasNext = res.data.hasNext
        this.data.followList = this.data.followList.concat(res.data.dataList)
        // 组装playList
        const list = []
        const infoList = []
        res.data.dataList.forEach(item => {
          list.push({
            id: item.id,
            url: item.videoRes && item.videoRes.resUrl || '',
            coverUrl: item.coverRes.resUrl
          })
          infoList.push({
            id: item.id,
            userinfo: item.userProfile.userinfo,
            interactiveInfo: item.interactiveInfo,
            userSnsInfo: item.userSnsInfo,
            content: item.content
          })
        })

        // 第一次进来 需要设置下
        if (this.data.followInfoList.length === 0) {
          this.setShareInfo(infoList[0])
        }

        this.setData({
          followParams: this.data.followParams,
          followVideoList: list,
          followInfoList: this.data.followInfoList.concat(infoList)
        })
        wx.hideLoading()
      }).catch(() => {
        wx.hideLoading()
      })
    },

    // 去个人主页
    goHome(e) {
      const id = e.currentTarget.dataset.id
      wx.navigateTo({
        url: '/pages/profile/userhome/userhome?targetUserId=' + id
      })
    },

    // 关注某人
    follow(e) {
      if (!app.globalData.hasLogin) {
        // 未登录
        wx.navigateTo({
          url: '/pages/login/login'
        })
        return
      }
      const id = e.currentTarget.dataset.id
      mcpRequest('sns.follow', {
        followType: 'follow',
        targetUserId: id
      }).then(res => {
        wx.showToast({
          title: '关注成功',
          icon: 'none'
        })
        this.data.recommendInfoList.forEach(item => {
          if (item.userinfo.userId === id) {
            item.userSnsInfo.followStatus = 1
          }
        })
        this.setData({
          recommendInfoList: this.data.recommendInfoList
        })
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
        const infoList = this.data.tab === 'tui' ? this.data.recommendInfoList : this.data.followInfoList
        infoList.forEach(item => {
          if (item.id === ugcId) {
            item.interactiveInfo.hasLike = res.data.hasLike
            item.interactiveInfo.likeAmount = res.data.likeAmount
            item.interactiveInfo.likeAmountText = res.data.likeAmountText
          }
        })
        if (this.data.tab === 'tui') {
          this.setData({
            recommendInfoList: infoList
          })
        } else {
          this.setData({
            followInfoList: infoList
          })
        }
      }).catch(err => {
        wx.showToast({
          title: err && err.errorMessage || '请求错误',
          icon: 'none'
        })
      })
    },

    // 设置分享显示数字
    setShareCount(ugcId, res) {
      const infoList = this.data.tab === 'tui' ? this.data.recommendInfoList : this.data.followInfoList
      infoList.forEach(item => {
        if (item.id === ugcId) {
          item.interactiveInfo.shareAmount = res.data.shareAmount
          item.interactiveInfo.shareAmountText = res.data.shareAmountText
        }
      })
      if (this.data.tab === 'tui') {
        this.setData({
          recommendInfoList: infoList
        })
      } else {
        this.setData({
          followInfoList: infoList
        })
      }
    },
    // 发布作品
    publishVideo(e) {
      if (!app.globalData.hasLogin) {
        // 未登录
        wx.navigateTo({ url: '/pages/login/login' })
      } else {
        wx.navigateTo({ url: '/pages/dance/video-publish/index' })
      }
    },
    // 切换tab 内容
    tabSelect(e) {
      const value = e.currentTarget.dataset.tab
      if (this.data.tab === value) {
        return
      }
      if (value === 'follow' && !app.globalData.hasLogin) {
        // 还未登录
        wx.navigateTo({
          url: '/pages/login/login'
        })
        return
      } else if (value === 'follow' && this.data.followParams.tailFlag === 0) {
        this.setData({
          isNewData: false
        })
        this.getFollowDataList()
      } else if (value === 'tui' && this.data.recommend.tailFlag === 0) {
        this.getDataList()
      }
      // 暂停 或者 开始视频
      if (value === 'follow') {
        this.setData({
          recommendStop: true,
          followStop: false
        })
        this.data.followInfoList.length > 0 ? this.setShareInfo(this.data.followInfoList[0]) : ''
      } else {
        this.setData({
          recommendStop: false,
          followStop: true
        })
        this.data.recommendInfoList.length > 0 ? this.setShareInfo(this.data.recommendInfoList[0]) : ''
      }
      app.globalData.danceTab = value
      this.setData({
        tab: value
      })
    },
    // 刷新内容
    refreshList() {
      wx.showLoading({
        title: '数据获取'
      })
      if (this.data.tab === 'follow' && app.globalData.hasLogin) {
        this.setData({
          followRefresh: true
        })
        // 关注用户
        this.resetParams(this.data.tab)
        this.getFollowDataList()
      } else if (this.data.tab === 'tui') {
        this.setData({
          recommendRefresh: true
        })
        // tuijian
        this.resetParams(this.data.tab)
        this.getDataList()
      }
    },
    // 重置参数
    resetParams(tab) {
      if (tab === 'follow') {
        this.data.followParams = {
          tailFlag: 0,
          pageSize: 15,
          hasNext: true
        }
        this.setData({
          followInfoList: [],
          followList: [],
          followVideoList: [],
          followParams: this.data.followParams
        })
      } else {
        this.data.recommend = {
          tailFlag: 0,
          pageSize: 15,
          hasNext: true
        }
        this.setData({
          recommendInfoList: [],
          recommendList: [],
          recommendVideoList: [],
          recommend: this.data.recommend
        })
      }
    },
    onLoadedMetaData(evt) {
      //   const { width, height, duration } = evt
    },
    onChange(e) {
      const ugcId = e.detail.activeId
      let videoList = []
      let infoList = []
      if (this.data.tab === 'follow') {
        videoList = this.data.followVideoList
        infoList = this.data.followInfoList
      } else {
        videoList = this.data.recommendVideoList
        infoList = this.data.recommendInfoList
      }
      const len = videoList.length
      videoList.forEach((item, index) => {
        if (item.id === ugcId && (len - index) < 4) {
          this.getList()
        }
      })
      let info = {}
      infoList.forEach(item => {
        if (item.id === ugcId) {
          info = item
        }
      })
      // 设置当前的ugcId，便于在上层分享时候传入
      this.setShareInfo(info)
    },

    onPlay(e) { },

    onPause(e) {
      //  console.log('pause', e.detail.activeId)
    },

    onEnded(e) { },

    onError(e) {
      console.log('error', e)
    },

    onWaiting(e) { },

    onTimeUpdate(e) { },

    onProgress(e) { }

  }
})
