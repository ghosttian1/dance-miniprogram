var city = require('../../../utils/city.js')
const app = getApp()

Page({
  data: {
    searchLetter: [],
    showLetter: '',
    winHeight: 0,
    // tHeight: 0,
    // bHeight: 0,
    cityList: [],
    isShowLetter: false,
    scrollTop: 0, // 置顶高度
    scrollTopId: '', // 置顶id
    city: '全国',
    hotcityList: [
      { cityCode: '', city: '全国' },
      { cityCode: 110100, city: '北京' },
      { cityCode: 310100, city: '上海' },
      { cityCode: 440100, city: '广州' },
      { cityCode: 440300, city: '深圳' },
      { cityCode: 330100, city: '杭州' },
      { cityCode: 120100, city: '天津' },
      { cityCode: 610100, city: '西安' },
      { cityCode: 320500, city: '苏州' },
      { cityCode: 420100, city: '武汉' },
      { cityCode: 350200, city: '厦门' },
      { cityCode: 430100, city: '长沙' },
      { cityCode: 510100, city: '成都' },
      { cityCode: 410100, city: '郑州' },
      { cityCode: 500100, city: '重庆' }
    ]
  },
  onLoad: function() {
    // 生命周期函数--监听页面加载
    this.setData({
      city: app.globalData.currentCity.city
    })

    var searchLetter = city.searchLetter
    var cityList = city.cityList(app.globalData.city)
    var sysInfo = wx.getSystemInfoSync()
    var winHeight = sysInfo.windowHeight
    var itemH = winHeight / searchLetter.length
    var tempObj = []
    for (var i = 0; i < searchLetter.length; i++) {
      var temp = {}
      temp.name = searchLetter[i]
      temp.tHeight = i * itemH
      temp.bHeight = (i + 1) * itemH
      tempObj.push(temp)
    }
    this.setData({
      winHeight: winHeight,
      itemH: itemH,
      searchLetter: tempObj,
      cityList: cityList
    })
  },
  onReady: function() {

    // 生命周期函数--监听页面初次渲染完成
  },
  onShow: function() {
    // 生命周期函数--监听页面显示
    this.city = app.globalData.currentCity.name
  },
  clickLetter: function(e) {
    var showLetter = e.currentTarget.dataset.letter
    this.setData({
      showLetter: showLetter,
      isShowLetter: true,
      scrollTopId: showLetter
    })
    var that = this
    setTimeout(function() {
      that.setData({
        isShowLetter: false
      })
    }, 1000)
  },
  // 选择城市
  bindCity: function(e) {
    this.setData({ city: e.currentTarget.dataset.city })
    app.globalData.currentCity = {
      city: this.data.city,
      code: e.currentTarget.dataset.citycode
    }
    wx.navigateBack()
  },
  // 选择热门城市
  bindHotCity: function(e) {
    this.setData({
      city: e.currentTarget.dataset.city
    })
    wx.setStorage({
      key: 'currentCity',
      data: {
        city: this.data.city,
        code: e.currentTarget.dataset.citycode
      }
    })
    app.globalData.currentCity = {
      city: this.data.city,
      code: e.currentTarget.dataset.citycode
    }
    wx.navigateBack()
  },
  // 点击热门城市回到顶部
  hotCity: function() {
    this.setData({
      scrollTop: 0
    })
  }
})
