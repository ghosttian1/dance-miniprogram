import mcpRequest from '../../../utils/mcp'
import { parseTime } from '../../../utils/util'

Page({
  // options: {
  //   addGlobalClass: true
  // },
  data: {
    list: [],
    params: {
      pageSize: 15,
      tailFlag: 0
    },
    hasNext: false
  },
  // lifetimes: {
  onLoad() {
    this.getList(true)
  },
  // },
  // pageLifetimes: {
  onShow() {
    this.getList(true)
    if (typeof this.getTabBar === 'function' &&
      this.getTabBar()) {
      this.getTabBar().setData({
        active: 'message'
      })
    }
  },
  // },
  // methods: {
  getList(refresh) {
    if (refresh) {
      this.setData({
        'params.tailFlag': 0,
        'hasNext': false
      })
    }

    wx.showLoading({ title: '数据加载中' })
    mcpRequest('message.dialogs', this.data.params).then(res => {
      res.data.dataList.forEach(item => {
        if (item.lastActionTime) {
          item.lastActionTimeText = this.parseTime(item.lastActionTime)
        }
      })

      if (refresh) {
        // 刷新请求，直接覆盖原列表数据即可
        this.setData({
          'list': res.data.dataList,
          'params.tailFlag': res.data.tailFlag,
          'params.pageSize': res.data.pageSize,
          'hasNext': res.data.hasNext
        })
      } else {
        // 获取更多的数据，需要在历史dataList下添加数据集
        let list = this.data.list
        list = list.concat(res.data.dataList)
        this.setData({
          'list': list,
          'params.tailFlag': res.data.tailFlag,
          'params.pageSize': res.data.pageSize,
          'hasNext': res.data.hasNext
        })
      }
      wx.hideLoading()
      // this.setData({
      //   list: res.data.dataList
      // })
    })
  },
  parseTime(time) {
    // console.log(new Date(time))
    return parseTime(new Date(time), 'yyyy-MM-dd')
  },

  /**
   *
   */
  onReachBottom() {
    if (this.data.hasNext) {
      this.getList(false)
    }
  },
  // 上啦刷新
  onReachTop() {
    // console.log(this.data)
  }
  // }

})
