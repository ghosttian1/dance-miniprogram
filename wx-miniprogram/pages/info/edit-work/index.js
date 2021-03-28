// pages/info/edit-dance/index.js
import mcpRequest from '../../../utils/mcp'
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 教学方向
    workDirection: [],
    obj: {
      direction: '',
      // 输入框的 money
      money: '',
      // 选择框的
      salary: '',
      // 地址
      address: '',
      // 要求内容
      comment: ''
    },
    areaLen: 0,
    addressLen: 0,
    addressMaxLen: 50,
    // 城市显示
    cityShow: '',
    cityIndex: [],
    // 教学方向展示
    directionIndex: '',
    // 薪资月薪 index
    moneyIndex: []
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.setMoney()
    const city = app.globalData.city
    this.setData({
      cityList: [app.globalData.city, city[0].children],
      workDirection: app.globalData.workDirection
    })
    // 设置编辑状态
    if (options && options.id) {
      this.setData({
        isEdit: true
      })
      this.loadInfo(options.id)
    } else {
      this.setData({
        isEdit: false
      })
    }
  },

  // 加载信息
  loadInfo(id) {
    mcpRequest('comment.recruit.info', { id }).then(res => {
      const { directionId, salary, address, comment, cityCode } = res.data.commentRecruit
      this.data.obj = {
        direction: directionId,
        address,
        comment,
        city: cityCode
      }
      if (directionId === 1045) {
        this.data.obj.money = salary
      } else {
        this.data.obj.salary = salary
      }
      this.setData({
        obj: this.data.obj,
        commentRecruit: res.data.commentRecruit,
        userInfo: res.data.userProfile.userinfo,
        enableRefresh: res.data.enableRefresh,
        areaLen: res.data.commentRecruit.comment.length,
        addressLen: res.data.commentRecruit.address.length
      })

      this.setDefaultPicker()
    })
  },

  // 设置默认picker 位置
  setDefaultPicker() {
    // 设置教学方向
    this.data.workDirection.forEach((item, index) => {
      if (item.code === this.data.obj.direction) {
        this.data.directionIndex = index
      }
    })
    // 如果匹配不到  则默认第一个  理论上不会出现
    this.data.directionIndex = this.data.directionIndex || 0
    this.setData({
      directionIndex: this.data.directionIndex
    })

    // 设置薪资
    if (this.data.obj.direction !== 1045) {
      let moneyIndex = []
      if (this.data.obj.salary === '面议') {
        moneyIndex = [0, null]
      } else {
        moneyIndex = this.data.obj.salary.split('-')
        moneyIndex[1] = moneyIndex[1].split('k')[0]
        const one = parseInt(moneyIndex[0])
        const two = parseInt(moneyIndex[1])
        moneyIndex = [one, two - one - 1]
        // 设置picker
        const arr = []
        let start = one + 1
        while (start < 31) {
          arr.push({
            text: start + 'k',
            value: start
          })
          start++
        }
        this.data.moneyPicker[1] = arr
      }

      this.setData({
        moneyPicker: this.data.moneyPicker,
        moneyIndex: moneyIndex
      })
    }

    // 设置城市
    this.data.cityList[0].forEach((item, i) => {
      item.children.forEach((el, k) => {
        if (el.code === this.data.obj.city) {
          this.data.cityList[1] = this.data.cityList[0][i].children
          this.setData({
            cityIndex: [i, k],
            cityList: this.data.cityList,
            cityShow: el.name
          })
        }
      })
    })
  },

  setMoney() {
    const arr = [{ text: '面议', value: 0 }]
    let k = 1
    while (k < 30) {
      arr.push({
        text: k + 'k',
        value: k
      })
      k++
    }
    this.setData({
      'moneyPicker': [arr, []]
    })
  },
  // 教学方向
  directionChange(e) {
    this.data.obj.direction = this.data.workDirection[e.detail.value].code
    this.setData({
      obj: this.data.obj,
      directionIndex: e.detail.value
    })
  },
  // 薪资
  moneyChange(e) {
    const arr = e.detail.value
    if (arr[0] === 0) {
      this.data.obj.salary = '面议'
    } else {
      arr[1] = arr[1] || 0
      this.data.obj.salary = `${arr[0]}-${arr[0] + arr[1] + 1}k`
    }
    this.setData({
      obj: this.data.obj,
      moneyIndex: arr
    })
  },
  bindMonthColumnChange(e) {
    const monthList = this.data.moneyPicker
    const column = e.detail.column
    let value = e.detail.value
    const arr = []
    switch (column) {
      case 0:
        if (value > 0) {
          value += 1
          while (value < 31) {
            arr.push({
              text: value + 'k',
              value: value
            })
            value++
          }
          monthList[1] = arr
        } else {
          monthList[1] = []
        }
        break
      case 1:
        break
    }
    this.setData({
      moneyPicker: this.data.moneyPicker
    })
  },
  // 薪资 输入框
  moneyInput(e) {
    const value = parseInt(e.detail.value)
    this.data.obj.money = value
    this.setData({
      obj: this.data.obj
    })
  },
  // 城市picker 改变
  bindCityPickerChange(e) {
    const cityValue = e.detail.value[1] || 0
    this.data.obj.city = this.data.cityList[1][cityValue].code
    this.setData({
      cityIndex: e.detail.value,
      obj: this.data.obj,
      cityShow: this.data.cityList[1][cityValue].name
    })
  },
  bindCityColumnChange(e) {
    const cityList = this.data.cityList
    const column = e.detail.column
    const value = e.detail.value
    switch (column) {
      case 0:
        cityList[1] = cityList[0][value].children
        break
      case 1:
        break
    }
    this.setData({
      cityList: cityList
    })
  },
  addressInput(e) {
    const value = e.detail.value
    const len = parseInt(value.length)
    this.setData({
      'obj.address': value,
      addressLen: len || 0 // 当前字数
    })
  },
  // 地址输入
  addressBlur(e) {
    const value = e.detail.value
    this.setData({
      'obj.address': value
    })
  },
  // 要求条件输入
  commentInput: function(e) {
    const value = e.detail.value
    const len = parseInt(value.length)
    // 最多字数限制
    this.setData({
      'obj.comment': value,
      areaLen: len || 0 // 当前字数
    })
  },
  // 要求条件  失去焦点
  commentBlur(e) {
    const value = e.detail.value
    this.setData({
      'obj.comment': value
    })
  },

  // 发布工作
  publish() {
    wx.nextTick(() => {
      let msg = ''
      const { direction, city, money, salary, address, comment } = this.data.obj
      if (!direction) {
        msg = '请填写教学方向'
      } else if (!city) {
        msg = '请选择城市'
      } else if (direction === 1045 && !money) {
        msg = '请填写费用'
      } else if (direction !== 1045 && !salary) {
        msg = '请选择薪资'
      } else if (!address) {
        msg = '请填写详细地址'
      } else if (!comment) {
        msg = '请填写要求'
      }
      if (msg) {
        wx.showToast({ title: msg, icon: 'none' })
        return
      }
      wx.showLoading()
      const data = Object.assign({}, this.data.obj)
      if (data.direction === 1045) {
        data.salary = data.money
      }
      delete data.money
      const id = this.data.isEdit ? this.data.commentRecruit.id : undefined
      mcpRequest('comment.recruit.publish', {
        'commentRecruit': {
          id,
          'directionId': data.direction,
          'salary': data.salary,
          'cityCode': data.city,
          'address': data.address,
          'comment': data.comment
        }
      }).then(res => {
        wx.hideLoading()
        const title = this.data.isEdit ? '更新成功' : '发布成功'
        wx.showToast({
          title: title,
          icon: 'success'
        })
        wx.navigateBack({
          delta: 1
        })
      }).catch(() => {
        wx.hideLoading()
        const title = this.data.isEdit ? '更新失败' : '发布失败'
        wx.showToast({
          title: title,
          icon: 'none'
        })
      })
    })
  }
})
