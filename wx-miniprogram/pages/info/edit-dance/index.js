import mcpRequest from '../../../utils/mcp'
const app = getApp()

// pages/info/edit-dance/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    obj: {
      gender: '',
      height: '',
      majorId: '',
      levelId: '',
      danceAge: '',
      cityCode: '',
      age: ''
    },
    areaLen: '0',
    pickValue: {
      height: 90,
      city: [0, 0]
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    // 设置 picker
    this.setAge()
    this.setHeight()
    const city = app.globalData.city
    this.data.picker.gender = app.globalData.gender
    this.data.picker.majorId = app.globalData.major
    this.data.picker.levelId = app.globalData.level
    this.setData({
      cityList: [app.globalData.city, city[0].children],
      picker: this.data.picker
    })
    if (options && options.id) {
      this.setData({
        isEdit: true,
        id: options.id
      })
      this.loadInfo(options.id)
    } else {
      this.setData({
        isEdit: false
      })
    }
  },
  // 暂时废弃
  loadUserInfo() {
    mcpRequest('user.info').then(res => {
      const { gender, height, danceAge, levelId, majorId } = res.data.userinfo
      this.data.obj = Object.assign({}, this.data.obj, { gender, height, danceAge, levelId, majorId })
      this.setData({
        obj: this.data.obj
      })
      this.setDefaultPicker()
    })
  },
  loadInfo(id) {
    mcpRequest('comment.partner.info', { id: id }).then(res => {
      const { danceAge, age, gender, height, levelId, majorId, training, comment, cityCode } = res.data.commentPartner
      this.data.obj = {
        gender: gender,
        height: height,
        danceAge: danceAge,
        levelId: levelId,
        majorId: majorId,
        age: age,
        training,
        comment,
        cityCode: cityCode
      }
      this.setData({
        obj: this.data.obj,
        areaLen: comment.length
      })
      this.setDefaultPicker()
    })
  },
  // 设置选择器默认选中
  setDefaultPicker() {
    const { gender, levelId, majorId, height, danceAge } = this.data.picker
    gender.forEach((item, index) => {
      if (item.code === this.data.obj.gender) {
        this.data.pickValue.gender = index
      }
    })
    levelId.forEach((item, index) => {
      if (item.code === this.data.obj.levelId) {
        this.data.pickValue.levelId = index
      }
    })
    this.data.pickValue.levelId = this.data.pickValue.levelId || 0
    majorId.forEach((item, index) => {
      if (item.code === this.data.obj.majorId) {
        this.data.pickValue.majorId = index
      }
    })
    height.forEach((item, index) => {
      if (item.toString() === this.data.obj.height.toString()) {
        this.data.pickValue.height = index
      }
    })
    danceAge.forEach((item, index) => {
      if (item.toString() === this.data.obj.danceAge.toString()) {
        this.data.pickValue.danceAge = index
      }
    })
    this.setData({
      pickValue: this.data.pickValue
    })

    // 设置城市
    this.data.cityList[0].forEach((item, i) => {
      item.children.forEach((el, k) => {
        if (el.code === this.data.obj.cityCode) {
          this.data.cityList[1] = this.data.cityList[0][i].children
          this.setData({
            'pickValue.city': [i, k],
            cityList: this.data.cityList,
            cityShow: el.name
          })
        }
      })
    })
  },

  setHeight() {
    const arr = []
    let k = 80
    while (k < 191) {
      arr.push(k)
      k++
    }
    arr.push('190+')
    this.setData({
      'picker.height': arr
    })
  },
  setAge() {
    const arr = []
    let k = 1
    while (k < 21) {
      arr.push(k)
      k++
    }
    arr.push('20+')
    this.setData({
      'picker.danceAge': arr
    })
  },
  pickerChange(e) {
    const type = e.target.dataset.type
    this.data.pickValue[type] = e.detail.value
    if (type === 'danceAge' || type === 'height') {
      this.data.obj[type] = this.data.picker[type][e.detail.value]
    } else {
      this.data.obj[type] = this.data.picker[type][e.detail.value].code
    }
    this.setData({
      obj: this.data.obj,
      pickValue: this.data.pickValue
    })
  },
  // 城市picker 改变
  bindCityPickerChange(e) {
    this.data.pickValue.city = e.detail.value
    const cityValue = e.detail.value[1] || 0
    this.data.obj.cityCode = this.data.cityList[1][cityValue].code
    this.setData({
      obj: this.data.obj,
      pickValue: this.data.pickValue,
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
  // 填写年龄
  getAge(e) {
    let value = e.detail.value
    value = parseInt(value)
    if (Number.isNaN(value)) {
      this.data.obj.age = ''
    } else {
      value = value < 1 ? 1 : value
      value = value > 80 ? 80 : value
      this.data.obj.age = value
    }
    this.setData({
      obj: this.data.obj
    })
  },
  // 学校
  trainingBlur(e) {
    const value = e.detail.value
    this.setData({
      'obj.training': value
    })
  },
  // 描述
  commentBlur(e) {
    const value = e.detail.value
    this.setData({
      'obj.comment': value
    })
  },
  textareaAInput: function(e) {
    const value = e.detail.value
    const len = parseInt(value.length)
    this.data.obj.comment = value
    // 最多字数限制
    if (len > 300) return
    this.setData({
      areaLen: len || 0, // 当前字数
      obj: this.data.obj
    })
  },
  publish() {
    // 使用异步
    wx.nextTick(() => {
      let msg = ''
      const { gender, height, majorId, levelId, danceAge, comment, cityCode, age } = this.data.obj
      if (!gender || !height || !majorId || !levelId || !danceAge || !comment || !cityCode || !age) {
        msg = '还有未填写项'
      }
      if (msg) {
        wx.showToast({ title: msg, icon: 'none' })
        return
      }
      const requestParams = {
        commentPartner: this.data.obj
      }
      if (this.data.isEdit) {
        requestParams.commentPartner.id = this.data.id
      }
      mcpRequest('comment.partner.publish', requestParams).then(res => {
        const title = this.data.isEdit ? '更新成功' : '发布成功'
        wx.showToast({
          title: title,
          icon: 'success'
        })
        wx.navigateBack({
          delta: 1
        })
      }).catch(() => {
        const title = this.data.isEdit ? '更新失败' : '发布失败'
        wx.showToast({
          title: title,
          icon: 'none'
        })
      })
    })
  }
})
