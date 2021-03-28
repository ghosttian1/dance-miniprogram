// pages/profile/release/release.js
import mcpRequest from '../../../utils/mcp'
import { formatTime } from '../../../utils/util'
const app = getApp()

Page({
  /**
     * 页面的初始数据
     */
  data: {
    sysTip: false,
    userInfo: {},
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
        text: '发布工作',
        value: 'work'
      }
    ],
    tabCur: 0,
    danceParams: {
      hasNext: true,
      tailFlag: 0,
      pageSize: 10
    },
    clothesParams: {
      hasNext: true,
      tailFlag: 0,
      pageSize: 10
    },
    workParams: {
      hasNext: true,
      'tailFlag': 0, // 尾标记，默认-1
      'pageSize': 10 // 分页大小,默认10
    },
    danceList: [],
    clothesList: [],
    workList: []
  },

  /**
     * 生命周期函数--监听页面加载
     */
  onLoad: function(options) {
    this.setData({
      userInfo: app.globalData.userInfo
    })
    // 用户第一次进行提示
    wx.getStorage({
      key: 'publish',
      fail: () => {
        this.setData({
          sysTip: true
        })
        wx.setStorage({
          key: 'publish',
          data: true
        })
      }
    })
  },
  onShow() {
    this.resetParams()
    this.getList()
  },

  // 内容切换
  tabSelect(evt) {
    this.setData({
      tabCur: evt.target.dataset.id
    })
    this.getList()
  },
  // 重置参数
  resetParams() {
    this.setData({
      danceParams: {
        hasNext: true,
        tailFlag: 0,
        pageSize: 10
      },
      clothesParams: {
        hasNext: true,
        tailFlag: 0,
        pageSize: 10
      },
      workParams: {
        hasNext: true,
        'tailFlag': 0, // 尾标记，默认-1
        'pageSize': 10 // 分页大小,默认10
      }
    })
  },

  getList(bl = false) {
    const arr = ['getDancePeopleList', 'getClothesList', 'getWorkList']
    this[arr[this.data.tabCur]](bl)
  },

  // 获取舞伴 列表
  getDancePeopleList(bl) {
    const params = this.data.danceParams
    if (!params.hasNext) {
      // 暂无更多数据
      return
    }
    wx.showLoading({ title: '数据加载中' })
    const data = Object.assign({}, params, { userId: this.data.userInfo.userId })
    mcpRequest('comment.partner.list', data).then(res => {
      wx.hideLoading()
      params.hasNext = res.data.hasNext
      params.tailFlag = res.data.tailFlag
      let danceList = this.data.danceList
      res.data.dataList.forEach(item => {
        item.commentPartner.actionTimeShow = formatTime(new Date(item.commentPartner.actionTime))
      })
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
    }).catch(() => {
      wx.hideLoading()
      wx.showToast({ title: '加载错误', icon: 'none' })
    })
  },

  // 赛服转让列表
  getClothesList(bl) {
    const params = this.data.clothesParams
    if (!params.hasNext) {
      // 暂无更多数据
      return
    }
    wx.showLoading({ title: '数据加载中' })
    const data = Object.assign({}, params, { userId: this.data.userInfo.userId })
    mcpRequest('comment.transfer.list', data).then(res => {
      wx.hideLoading()
      params.hasNext = res.data.hasNext
      params.tailFlag = res.data.tailFlag
      let clothesList = this.data.clothesList
      res.data.dataList.forEach(item => {
        item.commentTransfer.actionTimeShow = formatTime(new Date(item.commentTransfer.actionTime))
      })
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
    }).catch(() => {
      wx.hideLoading()
      wx.showToast({ title: '加载错误', icon: 'none' })
    })
  },

  // 发布工作列表
  getWorkList(bl) {
    const params = this.data.workParams
    if (!params.hasNext) {
      // 暂无更多数据
      return
    }
    wx.showLoading({ title: '数据加载中' })
    const data = Object.assign({}, params, { userId: this.data.userInfo.userId })
    mcpRequest('comment.recruit.list', data).then(res => {
      wx.hideLoading()
      params.hasNext = res.data.hasNext
      params.tailFlag = res.data.tailFlag
      let workList = this.data.workList
      res.data.dataList.forEach(item => {
        item.commentRecruit.actionTimeShow = formatTime(new Date(item.commentRecruit.actionTime))
      })
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
    }).catch(() => {
      wx.hideLoading()
      wx.showToast({ title: '加载错误', icon: 'none' })
    })
  },

  // ListTouch触摸开始
  ListTouchStart(e) {
    if (e.target.id === 'move') {
      return
    }
    this.setData({
      ListTouchStart: e.touches[0].pageX
    })
  },

  // ListTouch计算方向
  ListTouchMove(e) {
    if (e.target.id === 'move') {
      return
    }
  },

  // ListTouch计算滚动
  ListTouchEnd(e) {
    if (e.target.id === 'move') {
      return
    }
    const distance = e.changedTouches[0].pageX - this.data.ListTouchStart
    let direction
    if (distance > 0) {
      direction = 'right'
    } else if (distance < -100) {
      direction = 'left'
    } else {
      direction = ''
    }
    if (direction === 'left') {
      this.setData({
        modalName: e.currentTarget.dataset.target
      })
    } else {
      wx.nextTick(() => {
        this.setData({
          modalName: null
        })
      })
    }
    this.setData({
      ListTouchDirection: null
    })
  },

  goDetail(e) {
    if (this.data.modalName) {
      return false
    }
    const arr = [
      '/pages/info/detail-dance/detail',
      '/pages/info/detail-dress/dress',
      '/pages/info/detail-work/work'
    ]
    wx.navigateTo({
      url: arr[this.data.tabCur] + '?id=' + e.currentTarget.dataset.id
    })
  },

  move(e) {
    const type = e.currentTarget.dataset.type
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除',
      content: '确认删除该条内容吗？',
      success: res => {
        if (res.confirm) {
          // 删除
          wx.showLoading({
            title: '删除数据'
          })
          switch (type) {
            case 'dance':
              this.deleteDance(id)
              break
            case 'dress':
              this.deleteDress(id)
              break
            case 'work':
              this.deleteWork(id)
              break
          }
        }
      }

    })
  },
  // 删除舞伴
  deleteDance(id) {
    mcpRequest('comment.partner.delete', { id }).then(res => {
      let len = null
      this.data.danceList.forEach((item, index) => {
        if (item.commentPartner.id === id) {
          len = index
        }
      })
      if (len !== null) {
        this.data.danceList.splice(len, 1)
      }
      this.setData({
        danceList: this.data.danceList,
        modalName: null
      })
      wx.hideLoading()
      wx.showToast({
        title: '删除成功'
      })
    }).catch(() => {
      wx.hideLoading()
    })
  },
  // 删除赛服
  deleteDress(id) {
    mcpRequest('comment.transfer.delete', { id }).then(res => {
      let len = null
      this.data.clothesList.forEach((item, index) => {
        if (item.commentTransfer.id === id) {
          len = index
        }
      })
      if (len !== null) {
        this.data.clothesList.splice(len, 1)
      }
      this.setData({
        clothesList: this.data.clothesList,
        modalName: null
      })
      wx.hideLoading()
      wx.showToast({
        title: '删除成功'
      })
    }).catch(() => {
      wx.hideLoading()
    })
  },
  // 删除工作
  deleteWork(id) {
    mcpRequest('comment.recruit.delete', { id }).then(res => {
      let len = null
      this.data.workList.forEach((item, index) => {
        if (item.commentRecruit.id === id) {
          len = index
        }
      })
      if (len !== null) {
        this.data.workList.splice(len, 1)
      }
      this.setData({
        workList: this.data.workList,
        modalName: null
      })
      wx.hideLoading()
      wx.showToast({
        title: '删除成功'
      })
    }).catch(() => {
      wx.hideLoading()
    })
  },
  closeSysTip() {
    this.setData({
      sysTip: false
    })
  },
  /**
   * 页面上拉触底事件的处理函数
   * 加载更多
   */
  onReachBottom: function() {
    const { danceParams, clothesParams, workParams } = this.data
    const hasNext = [danceParams, clothesParams, workParams][this.data.tabCur]
    if (hasNext) {
      this.getList(true)
    }
  }
})
