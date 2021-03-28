import mcpRequest from '../../../utils/mcp'
import { isIOS } from '../../../utils/util'
import { getShareConfig } from '../../../utils/share'
import constants from '../../../utils/const'
import wxNotificationCenter from '../../../libs/WxNotificationCenter/WxNotificationCenter'

const app = getApp()
Page({
  data: {

    // 分享开关
    shareEnable: true,
    // 当前页面是否自定义分享内容（且需要自行实现onShareAppMessage方法）
    isOverShare: true,
    shareData: null,
    controls: isIOS() ? true : false, //app.globalData.systemInfo.platform === 'ios',
    StatusBar: app.globalData.StatusBar,
    CustomBar: app.globalData.CustmBar,
    windowHeight: '', // 屏幕高度
    // 原始 load 推荐列表
    recommendList: [],
    // 推荐video列表
    recommendVideoList: [],
    // 视频对应用户列表
    recommendInfoList: [],
    // 推荐列表
    recommend: {
      targetUserId: '',
      tailFlag: 0,
      pageSize: 15,
      hasNext: true
    },
    recommendActiveId: null,
    recommendVideoPause: false,
    recommendVideoCxt: null,
    // 当前播放item 设置分享用
    recommendItem: null,
    type: '',
    ugcId: '',
    systemInfo: wx.getSystemInfoSync()
  },

  onLoad(options) {
    this.registeNotification()
    // 用户ID
    this.data.recommend.targetUserId = options.targetUserId || ''
    // 类型
    this.data.type = options.type
    // ugcId
    this.data.ugcId = options.ugcId || ''
    // 需要在此设置 global   直接在data中赋值   数据不是最新的
    this.setData({
      StatusBar: app.globalData.StatusBar,
      CustomBar: app.globalData.CustomBar,
      windowHeight: wx.getSystemInfoSync().windowHeight,
      recommend: this.data.recommend
    })

    wx.showLoading({
      title: '数据加载中'
    })
    this.getList();
  },

  onShow() {
    // console.log("===ugc detail onshow===");
    // 
  },

  onUnload(options) {
    this.unregisteNotification()
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
    // 判断当前tab
    const ugcId = ugcListItem.id
    const ugcUserId = ugcListItem.userProfile.userinfo.userId
    let shareUrl = '/pages/dance/detail/index?ugcId=' + ugcId + '&targetUserId=' + ugcUserId
    shareUrl = shareUrl + '&type=20'
    getShareConfig({
      type: 20,
      id: ugcId
    }, shareUrl).then(res => {
      this.setData({
        shareData: res.data
      })
    })
  },

  getList() {
    this.getDataList()
  },
  // 获取用户ugc
  getDataList() {
    const command = 'ugc.info'
    const params = Object.assign({}, this.data.recommend, { ugcId: this.data.ugcId, type: this.data.type })
    if (!this.data.recommend.hasNext) {
      return
    }
    mcpRequest(command, params).then(res => {
      const isFirst = !this.data.recommendList.length
      this.data.recommend.tailFlag = res.data.tailFlag
      this.data.recommend.hasNext = res.data.hasNext
      this.data.recommendList = res.data.dataList
      // 组装playList
      const list = []
      const infoList = []
      // console.log(res.data.dataList)
      res.data.dataList.forEach(item => {
        list.push({
          id: item.id,
          url: item.videoRes && item.videoRes.resUrl,
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
        recommendList: this.data.recommendList,
        recommend: this.data.recommend,
        recommendVideoList: list,
        recommendActiveId: this.data.recommendActiveId,
        recommendInfoList: this.data.recommendInfoList.concat(infoList)
      })

      wx.hideLoading()
      if (this.data.recommendList && this.data.recommendList.length > 0) {
        this.checkVideoStatus(this.data.recommendList[0])
      }

      this.data.recommendVideoCxt === null ? this.data.recommendVideoCxt = wx.createVideoContext('videoRecommend') : ''
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
        if (item.userSnsInfo.userId === id) {
          item.userSnsInfo.followStatus = 1
        }
      })
      this.setData({
        recommendList: this.data.recommendList
      })
    })
  },
  // 点赞某人
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
      const infoList = this.data.recommendList
      infoList.forEach(item => {
        if (item.id === ugcId) {
          item.interactiveInfo.hasLike = res.data.hasLike
          item.interactiveInfo.likeAmount = res.data.likeAmount
          item.interactiveInfo.likeAmountText = res.data.likeAmountText
        }
      })
      this.setData({
        recommendList: infoList
      })
    }).catch(err => {
      console.log(err)
      wx.showToast({
        title: err && err.errorMessage || '请求错误',
        icon: 'none'
      })
    })
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
  // 刷新内容
  refreshList() {
    this.resetParams()
    this.getDataList()
  },
  // 重置参数
  resetParams(tab) {
    this.data.recommend = {
      hasNext: true,
      tailFlag: 0,
      pageSize: 15
    }
    this.setData({
      recommend: this.data.recommend
    })
  },
  onLoadedMetaData(evt) {
    //   const { width, height, duration } = evt
  },
  // 切换swiper
  swiperChange(e) {
    const current = e.detail.current
    this.data.recommendActiveId = this.data.recommendList[current].id
    this.data.recommendVideoCxt = wx.createVideoContext('videoRecommend')
    this.setData({
      recommendVideoPause: false,
      recommendActiveId: this.data.recommendActiveId,
      recommendItem: this.data.recommendList[current]
    })

    // 状态不正常的，进行提示
    this.checkVideoStatus(this.data.recommendItem)

    this.setShareInfo(this.data.recommendList[current])
    if (this.data.recommendList.length - current < 5) {
      this.getList()
    }
  },

  /**
   * 检查视频状态
   * @param {*} item
   */
  checkVideoStatus: function (item) {
    let title = '视频无法播放'
    if (item.status === -1) {
      title = '视频已被删除'
    } else if (item.status === 10 || item.status === 20) {
      title = '视频审核中'
    } else if (item.status === 30) {
      title = '视频审核不通过'
    } else if (item.status === 50) {
      title = '视频已被封禁'
    }

    if (item.status !== 40) {
      wx.hideShareMenu({
        menus: ['shareAppMessage', 'shareTimeline']
      })
      wx.showToast({
        title: title,
        icon: 'none',
        duration: 3000
      })
    } else {
      wx.showShareMenu({
        menus: ['shareAppMessage', 'shareTimeline']
      })
    }
  },

  // 废弃
  onChange(e) {
    const id = e.detail.activeId
    const len = this.data.recommendVideoList.length
    this.data.recommendVideoList.forEach((item, index) => {
      if (item.id === id && (len - index) < 4) {
        this.getList()
      }
    })
    let info = {}
    this.data.recommendInfoList.forEach(item => {
      if (item.id === id) {
        info = item
      }
    })
    // console.log("===setShareInfo===", info)
    // 设置当前的ugcId，便于在上层分享时候传入
    this.setShareInfo(info)
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    const ugcId = this.data.currentUgcId
    const reportShareParam = {
      ugcId: ugcId
    }
    mcpRequest('ugc.share', reportShareParam).then(res => {
      // 分享成功后，将分享数据立刻回显示到组件的ugc项中
      const infoList = this.data.recommendList
      infoList.forEach(item => {
        if (item.id === ugcId) {
          item.interactiveInfo.shareAmount = res.data.shareAmount
          item.interactiveInfo.shareAmountText = res.data.shareAmountText
        }
      })
      this.setData({
        recommendList: infoList
      })
    }).catch((err) => {
      console.log('==share err===', err)
    })
    return this.data.shareData ? this.data.shareData : app.globalData.defaultShareData
  },
  // 视频暂停
  videoPause(value) {
    this.data.recommendVideoCxt.pause()
    this.setData({
      recommendVideoPause: true
    })
  },
  // 视频播放
  videoPlay(value) {
    this.data.recommendVideoCxt.play()
    this.setData({
      recommendVideoPause: false
    })
  },
  stopPlayVideo() {
    const isIos = this.data.systemInfo.system.toLowerCase().indexOf('ios') > -1
    if (!isIos) {
      return
    }
    if (this.data.recommendVideoPause) {
      this.videoPlay(this.data.tab)
    } else {
      this.videoPause(this.data.tab)
    }
  },

  onPlay(e) {
    if (isIOS()) {
      this.setData({
        controls: true
      })
    }
  },

  onPause(e) {
    // console.log('pause', e)
  },

  onEnded(e) { },

  onError(e) {
    console.log('error', e)
  },

  onWaiting(e) { },

  onTimeUpdate(e) { },

  onProgress(e) { },

  /**
   * 响应广播事件
   * @param {*} data
   */
  onNotification(data, topic, that) {
    // 关注数据有变化，需要变更状态，便于重新加载数据
    if (topic === constants.notification.login || topic === constants.notification.logout) {
      // 重置内容  刷新
      that.setData({
        // 原始 load 推荐列表
        recommendList: [],
        // 推荐video列表
        recommendVideoList: [],
        // 视频对应用户列表
        recommendInfoList: [],
        // 推荐列表
        recommend: {
          targetUserId: this.data.recommend.targetUserId,
          tailFlag: 0,
          pageSize: 15,
          hasNext: true
        },
        recommendActiveId: null,
        recommendVideoPause: false,
        recommendVideoCxt: null,
        // 当前播放item 设置分享用
        recommendItem: null
      })
      that.getList()
    } else if (topic === constants.notification.follow || topic === constants.notification.unfollow) {
      // 遍历推荐与关注数据，定位到匹配的视频作者上，覆写其关注状态(followStatus)
      that.data.recommendList.forEach(item => {
        if (item.userId === data.userId) {
          item.userSnsInfo.followStatus = data.followStatus
        }
      })
      that.setData({
        recommendList: that.data.recommendList
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
      that.setData({
        recommendList: that.data.recommendList
      })
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
  },

  unregisteNotification() {
    // 取消注册消息
    wxNotificationCenter.removeNotification(constants.notification.login, this)
    wxNotificationCenter.removeNotification(constants.notification.logout, this)
    wxNotificationCenter.removeNotification(constants.notification.follow, this)
    wxNotificationCenter.removeNotification(constants.notification.unfollow, this)

    wxNotificationCenter.removeNotification(constants.notification.like, this)
    wxNotificationCenter.removeNotification(constants.notification.unlike, this)
  }
})
