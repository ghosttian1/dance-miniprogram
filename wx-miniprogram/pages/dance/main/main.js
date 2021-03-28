import mcpRequest from '../../../utils/mcp'
import { isIOS } from '../../../utils/util'
import { getShareConfig, shareRedirect } from '../../../utils/share'
import constants from '../../../utils/const'
import wxNotificationCenter from '../../../libs/WxNotificationCenter/WxNotificationCenter'

/**
 * 新版首页
 */
const app = getApp()
Page({
  data: {
    // 分享开关
    shareEnable: true,
    // 当前页面是否自定义分享内容（且需要自行实现onShareAppMessage方法）
    isOverShare: true,
    shareData: null,

    controls: isIOS() ? true : false,// app.globalData.systemInfo.platform === 'ios',
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
    recommendActiveId: null,
    recommendVideoPause: false,
    recommendVideoCxt: null,
    // 当前播放item 设置分享用
    recommendItem: null,
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
    followActiveId: null,
    followVideoPause: false,
    followVideoCxt: null,
    // 当前播放item 设置分享用
    followItem: null,
    // 是否显示分享提示
    shareTip: false,
    // 关注的人是否有新消息
    isNewData: false,
    // 是否强制重刷页面（登录、注销登录时需要重新刷新页面数据，重制交互等数据）
    isForceReload: true,
    systemInfo: wx.getSystemInfoSync()
  },

  onLoad(options) {
    // 注册通知事件
    this.registeNotification()

    // 分享后跳转目标页的处理
    shareRedirect(options.redirectUrl)
  },
  onReady() {
    this.init()
  },
  onUnload() {
    // 销毁广播
    this.unregisteNotification()
  },
  onShow() {
    // 页面被展示
    // console.log('====show==')
    this.init()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        active: 'dance'
      })
    }
  },

  // ready() {
  //   this.ready();
  // },

  init() {
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
    if (topic === constants.notification.login || topic === constants.notification.logout) {
      that.data.isForceReload = true
    } else if (topic === constants.notification.follow || topic === constants.notification.unfollow) {
      // 遍历推荐与关注数据，定位到匹配的视频作者上，覆写其关注状态(followStatus)
      that.data.recommendList.forEach(item => {
        if (item.userId === data.userId) {
          item.userSnsInfo.followStatus = data.followStatus
        }
      })
      that.data.followList.forEach(item => {
        if (item.userId === data.userId) {
          item.userSnsInfo.followStatus = data.followStatus
        }
      })

      that.setData({
        recommendList: that.data.recommendList,
        followList: that.data.followList
      })
    } else if (topic === constants.notification.like || topic === constants.notification.unlike) {
      // 遍历推荐与关注数据，定位到匹配的视频作者上，覆写其like(followStatus)
      that.data.recommendList.forEach(item => {
        if (item.id === data.ugcId) {
          item.interactiveInfo.hasLike = data.hasLike
          item.interactiveInfo.likeAmount = data.likeAmount
          item.interactiveInfo.likeAmountText = data.likeAmountText
        }
      })
      that.data.followList.forEach(item => {
        if (item.id === data.ugcId) {
          item.interactiveInfo.hasLike = data.hasLike
          item.interactiveInfo.likeAmount = data.likeAmount
          item.interactiveInfo.likeAmountText = data.likeAmountText
        }
      })

      that.setData({
        recommendList: that.data.recommendList,
        followList: that.data.followList
      })
    } else if (topic === constants.notification.doubleTap) {
      that.refreshList()
    }
  },

  registeNotification() {
    // console.log('===dancehome registeNotification===')
    // 增加注册消息
    wxNotificationCenter.addNotification(constants.notification.login, this.onNotification, this)
    wxNotificationCenter.addNotification(constants.notification.logout, this.onNotification, this)
    wxNotificationCenter.addNotification(constants.notification.follow, this.onNotification, this)
    wxNotificationCenter.addNotification(constants.notification.unfollow, this.onNotification, this)
    wxNotificationCenter.addNotification(constants.notification.like, this.onNotification, this)
    wxNotificationCenter.addNotification(constants.notification.unlike, this.onNotification, this)
    wxNotificationCenter.addNotification(constants.notification.doubleTap, this.onNotification, this)
  },

  unregisteNotification() {
    // console.log('===dancehome unregisteNotification===')

    // 取消注册消息
    wxNotificationCenter.removeNotification(constants.notification.login, this)
    wxNotificationCenter.removeNotification(constants.notification.logout, this)
    wxNotificationCenter.removeNotification(constants.notification.follow, this)
    wxNotificationCenter.removeNotification(constants.notification.unfollow, this)
    wxNotificationCenter.removeNotification(constants.notification.like, this)
    wxNotificationCenter.removeNotification(constants.notification.unlike, this)
    wxNotificationCenter.removeNotification(constants.notification.doubleTap, this)
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
    const ugcUserId = ugcListItem.userProfile.userinfo.userId
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
      const isFirst = !this.data.recommendList.length
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
      if (isFirst) {
        this.setShareInfo(this.data.recommendList[0])
        this.data.recommendActiveId = res.data.dataList[0].id
        this.setData({
          recommendVideoPause: false
        })
      }

      this.setData({
        recommend: this.data.recommend,
        recommendVideoList: list,
        recommendList: this.data.recommendList,
        recommendActiveId: this.data.recommendActiveId,
        recommendInfoList: this.data.recommendInfoList.concat(infoList)
      })
      this.data.recommendVideoCxt === null ? this.data.recommendVideoCxt = wx.createVideoContext('videoRecommend', this) : ''
      wx.hideLoading()
    }).catch(() => {
      wx.hideLoading()
    })
  },
  // 我关注的
  getFollowDataList() {
    mcpRequest('ugc.userFollowedUgcs', this.data.followParams).then(res => {
      const isFirst = !this.data.followList.length
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
      if (isFirst) {
        this.setShareInfo(this.data.followList[0])
        this.data.followActiveId = this.data.followList[0].id
        this.setData({
          followVideoPause: false
        })
      }

      this.setData({
        followParams: this.data.followParams,
        followVideoList: list,
        followActiveId: this.data.followActiveId,
        followList: this.data.followList,
        followInfoList: this.data.followInfoList.concat(infoList)
      })

      this.data.followVideoCxt === null ? this.data.followVideoCxt = wx.createVideoContext('videoFollow', this) : ''
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
      //发送事件广播
      wxNotificationCenter.postNotificationName(constants.notification.follow, res.data)

      this.data.recommendList.forEach(item => {
        if (item.userProfile.userinfo.userId === id) {
          item.userSnsInfo.followStatus = 1
        }
      })
      this.setData({
        recommendList: this.data.recommendList
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
      const postData = Object.assign({ ugcId }, res.data)
      wxNotificationCenter.postNotificationName(constants.notification[hasLike ? 'unlike' : 'like'], postData, this)
      const infoList = this.data.tab === 'tui' ? this.data.recommendList : this.data.followList
      infoList.forEach(item => {
        if (item.id === ugcId) {
          item.interactiveInfo.hasLike = res.data.hasLike
          item.interactiveInfo.likeAmount = res.data.likeAmount
          item.interactiveInfo.likeAmountText = res.data.likeAmountText
        }
      })
      if (this.data.tab === 'tui') {
        this.setData({
          recommendList: infoList
        })
      } else {
        this.setData({
          followList: infoList
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
    const infoList = this.data.tab === 'tui' ? this.data.recommendList : this.data.followList
    infoList.forEach(item => {
      if (item.id === ugcId) {
        item.interactiveInfo.shareAmount = res.data.shareAmount
        item.interactiveInfo.shareAmountText = res.data.shareAmountText
      }
    })
    if (this.data.tab === 'tui') {
      this.setData({
        recommendList: infoList
      })
    } else {
      this.setData({
        followList: infoList
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
      this.data.followItem ? this.setShareInfo(this.data.followItem) : ''
    } else {
      this.data.recommendItem ? this.setShareInfo(this.data.recommendItem) : ''
    }
    app.globalData.danceTab = value
    this.setData({
      tab: value
    })
  },
  // 视频暂停
  videoPause(value) {
    if (value === 'tui') {
      this.data.recommendVideoCxt.pause()
      this.setData({
        recommendVideoPause: true
      })
    } else {
      this.data.followVideoCxt.pause()
      this.setData({
        followVideoPause: true
      })
    }
  },
  // 视频播放
  videoPlay(value) {
    if (value === 'tui') {
      this.data.recommendVideoCxt.play()
      this.setData({
        recommendVideoPause: false
      })
    } else {
      this.data.followVideoCxt.play()
      this.setData({
        followVideoPause: false
      })
    }
  },
  stopPlayVideo() {
    const isIos = this.data.systemInfo.system.toLowerCase().indexOf('ios') > -1
    if (!isIos) {
      return
    }
    if (this.data.tab === 'tui') {
      if (this.data.recommendVideoPause) {
        this.videoPlay(this.data.tab)
      } else {
        this.videoPause(this.data.tab)
      }
    } else {
      if (this.data.followVideoPause) {
        this.videoPlay(this.data.tab)
      } else {
        this.videoPause(this.data.tab)
      }
    }
  },
  // 刷新内容
  refreshList() {
    wx.showLoading({
      title: '数据获取'
    })
    this.stopPlayVideo()
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
  // 切换swiper
  swiperChange(e) {
    const current = e.detail.current
    if (this.data.tab === 'follow') {
      this.data.followActiveId = this.data.followList[current].id
      this.data.followVideoCxt = wx.createVideoContext('videoFollow', this)
      this.setData({
        followVideoPause: false,
        followActiveId: this.data.followActiveId,
        followItem: this.data.followList[current]
      })
      this.setShareInfo(this.data.followList[current])
      if (this.data.followList.length - current < 5) {
        this.getList()
      }
    } else {
      this.data.recommendActiveId = this.data.recommendList[current].id
      this.data.recommendVideoCxt = wx.createVideoContext('videoRecommend', this)
      this.setData({
        recommendVideoPause: false,
        recommendActiveId: this.data.recommendActiveId,
        recommendItem: this.data.recommendList[current]
      })
      this.setShareInfo(this.data.recommendList[current])
      if (this.data.recommendList.length - current < 5) {
        this.getList()
      }
    }
  },
  // 暂时废弃
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

  onPlay(e) {
    if (isIOS()) {
      this.setData({
        controls: true
      })
    }
  },

  onPause(e) {
    //  console.log('pause', e.detail.activeId)
  },

  onEnded(e) { },

  onError(e) {
    console.log('error', e)
  },

  onWaiting(e) { },

  onTimeUpdate(e) { },

  onProgress(e) { },

  /**
 * 用户点击右上角分享
 */
  onShareAppMessage: function () {
    let shareData = this.data.shareData ? this.data.shareData : app.globalData.defaultShareData
    let ugcId = this.data.currentUgcId;
    const reportShareParam = {
      ugcId: ugcId
    }
    //分享计数+1
    mcpRequest('ugc.share', reportShareParam).then(res => {
      // 分享成功后，将分享数据立刻回显示到组件的ugc项中


      //目前是遍历的方式，TODO 重构为异步通知进行解耦
      const followList = this.data.followList
      followList.forEach(item => {
        if (item.id === ugcId) {
          item.interactiveInfo.shareAmount = res.data.shareAmount
          item.interactiveInfo.shareAmountText = res.data.shareAmountText
        }
      })
      this.setData({
        followList: followList
      });

      //目前是遍历的方式，TODO 重构为异步通知进行解耦
      const recommendList = this.data.recommendList
      recommendList.forEach(item => {
        if (item.id === ugcId) {
          item.interactiveInfo.shareAmount = res.data.shareAmount
          item.interactiveInfo.shareAmountText = res.data.shareAmountText
        }
      })
      this.setData({
        recommendList: recommendList
      })




    }).catch((err) => {
      console.log('==share err===', err)
    })
    return shareData;

  }
})
