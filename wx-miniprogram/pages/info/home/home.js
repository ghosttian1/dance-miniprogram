import mcpRequest from '../../../utils/mcp'
import { getShareConfig, shareRedirect } from '../../../utils/share'

const app = getApp()
Page({

  data: {

    // 分享开关
    shareEnable: true,
    // 当前页面是否自定义分享内容（且需要自行实现onShareAppMessage方法）
    isOverShare: true,
    shareData: null,

    StatusBar: app.globalData.StatusBar,
    CustomBar: app.globalData.CustomBar,
    Custom: app.globalData.Custom,
    // 条件列表
    tabList: [
      {
        text: '找舞伴',
        value: 'dance'
      },
      {
        text: '赛服转让',
        value: 'clothes'
      },
      {
        text: '找工作',
        value: 'work'
      }
    ],
    // 条件选中的值
    conditionValue: {},
    // 默认选中第一个标签
    TabCur: '',
    tagList: ['专业拉丁', '20', '女', '10年', '170cm'],
    // 当前城市
    cityInfo: {},
    // 找舞伴
    // 性别
    gender: [],
    genderSelectedIndex: null,
    // 专业
    major: [],
    majorSelectedIndex: null,
    // 水平
    level: [],
    levelSelectedIndex: null,
    danceParams: {
      hasNext: true,
      tailFlag: 0,
      pageSize: 10,
      gender: -1,
      majorId: -1,
      levelId: -1
    },
    danceList: [],
    // 赛服 类型
    clothesType: [],
    clothesSelectedIndex: 0,
    clothesParams: {
      hasNext: true,
      tailFlag: 0,
      pageSize: 10,
      majorId: -1 // 专业id
    },
    // 赛服列表
    clothesList: [],
    // 找工作的筛选条件
    workDirection: [],
    workSelectedIndex: 0,
    workParams: {
      hasNext: true,
      'tailFlag': 0, // 尾标记，默认-1
      'pageSize': 10, // 分页大小,默认10
      'directionId': -1 // 方向id，兼职代课之类
    },
    // 找工作列表
    workList: [],
    limit: {},
    publishModalShow: false,
    // 隐藏显示配置
    pageConfig: {},
    // 各个tab切换滚动高度
    scrollTop: {
      dance: 0,
      clothes: 0,
      work: 0
    },
    triggered: false,
    // 下拉上啦加载信息
    danceScroll: {
      pagination: {
        page: 1,
        totalPage: 10,
        length: 1000
      },
      refresh: {
        type: 'default',
        style: 'black',
        background: '#000'
      },
      loadmore: {
        type: 'default',
        icon: 'http://upload-images.jianshu.io/upload_images/5726812-95bd7570a25bd4ee.gif',
        background: '#f2f2f2',
        title: {
          show: true,
          text: '加载中',
          color: '#999',
          shadow: 5
        }
      }
    },
    clothesScroll: {
      pagination: {
        page: 1,
        totalPage: 10,
        length: 1000
      },
      refresh: {
        type: 'default',
        style: 'black',
        background: '#000'
      },
      loadmore: {
        type: 'default',
        icon: 'http://upload-images.jianshu.io/upload_images/5726812-95bd7570a25bd4ee.gif',
        background: '#f2f2f2',
        title: {
          show: true,
          text: '加载中',
          color: '#999',
          shadow: 5
        }
      }
    },
    workScroll: {
      pagination: {
        page: 1,
        totalPage: 10,
        length: 10000
      },
      refresh: {
        type: 'default',
        style: 'black',
        background: '#000'
      },
      loadmore: {
        type: 'default',
        icon: 'http://upload-images.jianshu.io/upload_images/5726812-95bd7570a25bd4ee.gif',
        background: '#f2f2f2',
        title: {
          show: true,
          text: '加载中',
          color: '#999',
          shadow: 5
        }
      }
    }
  },
  // lifetimes: {
  // 生命周期函数，可以为函数，或一个在methods段中定义的方法名
  onLoad: function(options) {
    app.globalData.configPromise.then(res => {
      // 新数组  防止改变污染
      const workDirection = [...app.globalData.workDirection]
      const clothesType = [...app.globalData.clothesType]
      const major = [...app.globalData.major]
      const level = [...app.globalData.level]
      const gender = [...app.globalData.gender]
      workDirection.unshift({ 'text': '全部', code: -1 })
      clothesType.unshift({ 'text': '全部', code: -1 })
      major.unshift({ 'text': '全部', code: -1 })
      level.unshift({ 'text': '全部', code: -1 })
      gender.unshift({ 'text': '全部', code: -1 })
      this.setData({
        cityInfo: app.globalData.currentCity,
        userInfo: app.globalData.userInfo,
        workDirection: workDirection,
        clothesType: clothesType,
        level: level,
        major: major,
        gender: gender,
        pageConfig: app.globalData.pageConfig
      })

      this.setTabList()
      this.getList()
      this.isUserHasPublishProcess()
      this.loadShareConfig()

      // 分享后跳转目标页的处理
      shareRedirect(options.redirectUrl)
    }).catch((e) => {
      // console.log("====请求错误=====", e);
      wx.showToast({
        title: '请求错误',
        icon: 'none'
      })
    })
  },
  // },
  onShow() {
    const cityInfo = app.globalData.currentCity
    if (this.hide) {
      if (cityInfo.code !== this.data.cityInfo.code) {
        // 如果城市变化 则需要刷新页面
        this.data.danceParams.hasNext = true
        this.data.danceParams.tailFlag = 0
        this.data.clothesParams.hasNext = true
        this.data.clothesParams.tailFlag = 0
        this.data.workParams.hasNext = true
        this.data.workParams.tailFlag = 0
        this.setData({
          'danceParams': this.data.danceParams,
          'clothesParams': this.data.clothesParams,
          'workParams': this.data.workParams,
          cityInfo: app.globalData.currentCity
        })
        this.setData({
          danceList: [],
          clothesList: [],
          workList: [],
          userInfo: app.globalData.userInfo,
          publishModalShow: false
        })
        // 当前tab 滚条位置需要重置
        this.data.scrollTop = {
          dance: 0,
          clothes: 0,
          work: 0
        }
        this.setScrollTop()
        this.getList()
      }
      this.hide = false
    }
    if (typeof this.getTabBar === 'function' &&
      this.getTabBar()) {
      // console.log(this.getTabBar(), 'dddddinfo')
      this.getTabBar().setData({
        active: 'info'
      })
    }
  },
  onHide() {
    this.hide = true
  },
  showVersion() {
    wx.showToast({
      title: `当前版本：${app.globalData.version}`,
      icon: 'none'
    })
  },
  /**
   * 加载分享配置， TODO 调用时机
   * @param {} id
   */
  loadShareConfig(id) {
    getShareConfig({
      type: 30
    }, null, '/pages/info/home/home').then(res => {
      this.setData({
        shareData: res.data
      })
    })
  },
  setTabList() {
    // 设置tabList
    const pageConfig = app.globalData.pageConfig
    const tabList = []
    if (pageConfig.commentPartner === 'true') {
      tabList.push({
        text: '找舞伴',
        value: 'dance'
      })
    }
    if (pageConfig.commentTransfer === 'true') {
      tabList.push({
        text: '赛服转让',
        value: 'clothes'
      })
    }
    if (pageConfig.commentRecruit === 'true') {
      tabList.push({
        text: '找工作',
        value: 'work'
      })
    }
    var tabActive = tabList[0].value
    tabList.forEach(item => {
      if (item.value === this.properties.activeTab) {
        tabActive = item.value
      }
    })
    this.setData({
      TabCur: tabActive,
      tabList: tabList
    })
  },

  // 内容切换
  tabSelect(evt) {
    this.setData({
      TabCur: evt.target.dataset.value
    })
    const obj = { dance: 'danceParams', clothes: 'clothesParams', work: 'workParams' }
    const params = this.data[obj[this.data.TabCur]]
    // 没有加载过  需要获取，加载过的不需要再次获取了
    if (params.hasNext && params.tailFlag === 0) {
      this.getList()
    }
    this.setScrollTop()
  },
  getList(bl = false) {
    const obj = { dance: 'getDancePeopleList', clothes: 'getClothesList', work: 'getWorkList' }
    this[obj[this.data.TabCur]](bl)
  },
  // 获取舞伴 列表
  getDancePeopleList(bl) {
    const params = this.data.danceParams
    if (!params.hasNext) {
      this.setLoadEnd('danceScroll')
      // 暂无更多数据
      return
    }
    wx.showLoading({ title: '数据加载中' })
    const data = Object.assign({}, params, { 'cityCode': this.data.cityInfo.code })
    mcpRequest('comment.partner.list', data).then(res => {
      wx.hideLoading()
      params.hasNext = res.data.hasNext
      params.tailFlag = res.data.tailFlag
      let danceList = this.data.danceList
      if (bl) {
        // 加载更多
        danceList = danceList.concat(res.data.dataList)
      } else {
        danceList = res.data.dataList
      }
      this.setData({
        danceList: danceList,
        danceParams: params
      })
      if (!params.hasNext) {
        this.setLoadEnd('danceScroll')
      }
    }).catch(() => {
      wx.hideLoading()
      wx.showToast({ title: '加载错误', icon: 'none' })
    })
  },
  genderSelectChange(e) {
    const value = e.detail.value
    const danceParams = this.data.danceParams
    danceParams.gender = this.data.gender[value].code
    // 从头开始
    danceParams.hasNext = true
    danceParams.tailFlag = 0
    this.setData({
      genderSelectedIndex: value,
      danceParams: danceParams
    })
    this.getList()
  },
  majorSelectChange(e) {
    const value = e.detail.value
    const danceParams = this.data.danceParams
    danceParams.majorId = this.data.major[value].code
    // 从头开始
    danceParams.hasNext = true
    danceParams.tailFlag = 0
    this.setData({
      majorSelectedIndex: value,
      danceParams: danceParams
    })
    this.getList()
  },
  levelSelectChange(e) {
    const value = e.detail.value
    const danceParams = this.data.danceParams
    danceParams.levelId = this.data.level[value].code
    // 从头开始
    danceParams.hasNext = true
    danceParams.tailFlag = 0
    this.setData({
      levelSelectedIndex: value,
      danceParams: danceParams
    })
    this.getList()
  },
  // 赛服转让列表
  getClothesList(bl) {
    const params = this.data.clothesParams
    if (!params.hasNext) {
      this.setLoadEnd('clothesScroll')
      // 暂无更多数据
      return
    }
    wx.showLoading({ title: '数据加载中' })
    const data = Object.assign({}, params)
    mcpRequest('comment.transfer.list', data).then(res => {
      wx.hideLoading()
      params.hasNext = res.data.hasNext
      params.tailFlag = res.data.tailFlag
      let clothesList = this.data.clothesList
      if (bl) {
        // 加载更多
        clothesList = clothesList.concat(res.data.dataList)
      } else {
        clothesList = res.data.dataList
      }
      this.setData({
        clothesList: clothesList,
        clothesParams: params
      })
      if (!params.hasNext) {
        this.setLoadEnd('clothesScroll')
      }
    }).catch(() => {
      wx.hideLoading()
      wx.showToast({ title: '加载错误', icon: 'none' })
    })
  },
  // 赛服转让 条件筛选
  clothesSelectChange(e) {
    const value = e.detail.value
    const clothesParams = this.data.clothesParams
    clothesParams.majorId = this.data.clothesType[value].code
    // 从头开始
    clothesParams.hasNext = true
    clothesParams.tailFlag = 0
    this.setData({
      clothesSelectedIndex: value,
      clothesParams: clothesParams
    })
    this.getList()
  },
  // 找工作列表
  getWorkList(bl) {
    const params = this.data.workParams
    if (!params.hasNext) {
      // 暂无更多数据
      this.setLoadEnd('workScroll')
      return
    }
    wx.showLoading({ title: '数据加载中' })
    const data = Object.assign({}, params)
    data.cityCode = this.data.cityInfo.code
    // data.userId = 10
    mcpRequest('comment.recruit.list', data).then(res => {
      wx.hideLoading()
      params.hasNext = res.data.hasNext
      params.tailFlag = res.data.tailFlag
      let workList = this.data.workList
      if (bl) {
        // 加载更多
        workList = workList.concat(res.data.dataList)
      } else {
        workList = res.data.dataList
      }
      this.setData({
        workList: workList,
        workParams: params
      })
      if (!params.hasNext) {
        this.setLoadEnd('workScroll')
      }
    }).catch(() => {
      wx.hideLoading()
      wx.showToast({ title: '加载错误', icon: 'none' })
    })
  },
  // 找工作条件筛选
  workSelectChange(e) {
    const value = e.detail.value
    this.data.workParams.directionId = this.data.workDirection[value].code
    // 从头开始
    this.data.workParams.hasNext = true
    this.data.workParams.tailFlag = 0
    this.setData({
      workSelectedIndex: value,
      workParams: this.data.workParams
    })
    this.getList()
  },

  openModal() {
    if (app.globalData.hasLogin) {
      this.setData({
        publishModalShow: true
      })
    } else {
      // 未登录
      wx.navigateTo({
        url: '/pages/login/login'
      })
    }
  },
  goToPublish(e) {
    const id = e.currentTarget.dataset.id
    const url = e.currentTarget.dataset.url
    const value = this.data.limit[id]
    if (value === 30) {
      return
    }
    if (id === 'partner' && this.data.limit.partner === 20) {
      // 禁止
      wx.showToast({ title: '每天最多发布10个帖子哟', icon: 'none' })
    } else if (id === 'recruit' && this.data.limit.recruit === 20) {
      // 禁止
      wx.showToast({ title: '每天最多发布10个帖子哟', icon: 'none' })
    } else {
      wx.navigateTo({
        url: url
      })
      this.closeModal()
    }
  },
  closeModal() {
    this.setData({
      publishModalShow: false
    })
  },
  // 判断用户是否能发布
  isUserHasPublishProcess() {
    mcpRequest('comment.posting.limit').then(res => {
      this.setData({
        limit: res.data
      })
    })
  },
  onReachEnd() {
    // this.getList(true)
  },
  // 刷新
  refresh: function() {
    const obj = { dance: 'danceParams', clothes: 'clothesParams', work: 'workParams' }
    const params = this.data[obj[this.data.TabCur]]
    // 重置内容
    params.hasNext = true
    params.tailFlag = 0
    // 重置page
    let tabScrollObj = ''
    if (this.data.TabCur === 'dance') {
      tabScrollObj = 'danceScroll'
    } else if (this.data.TabCur === 'clothes') {
      tabScrollObj = 'clothesScroll'
    } else if (this.data.TabCur === 'work') {
      tabScrollObj = 'workScroll'
    }
    this.data[tabScrollObj].pagination.page = 1
    this.setData({
      [obj[this.data.TabCur]]: params,
      [tabScrollObj]: this.data[tabScrollObj]
    })
    this.getList(false)
  },
  loadMore: function() {
    this.getList(true)
  },
  setLoadEnd(sc) {
    setTimeout(() => {
      this.data[sc].pagination.page = 10
      this.data[sc].hasNext = false
      this.setData({
        [sc]: this.data[sc]
      })
    }, 1000)
  },
  // 滚动到指定位置
  setScrollTop() {
    wx.nextTick(() => {
      wx.pageScrollTo({
        scrollTop: this.data.scrollTop[this.data.TabCur],
        duration: 0
      })
    })
  },

  /**
  * 用户点击右上角分享
  */
  onShareAppMessage: function() {
    return this.data.shareData ? this.data.shareData : app.globalData.defaultShareData
  }

})
