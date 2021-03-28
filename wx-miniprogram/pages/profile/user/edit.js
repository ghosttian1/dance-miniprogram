// pages/profile/user/edit.js
import mcpRequest, { mcpFormData } from '../../../utils/mcp'
import config from '../../../utils/config'

const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 存储的值 传给服务器的值
    obj: {},
    // picker 集合
    picker: {},
    // 选中的picker 的各种index集合、
    pickValue: {
      height: 90
    },
    nameLen: 0,
    areaLen: 0,
    headPromise: null,
    isHead: false
  },
  onLoad(options) {
    // 从选择头像返回 应该显示头像内容
    if (options.src) {
      this.data.isHead = true
      this.data.obj.avatar = options.src
      this.uploadImg(options.src)
    } else {
      this.data.isHead = false
    }
    const currentUserInfo = app.globalData.userInfo
    // 设置 picker
    this.setAge()
    this.setHeight()
    this.data.picker.gender = app.globalData.gender
    this.data.picker.majorId = app.globalData.major
    this.data.picker.levelId = app.globalData.level
    this.setData({
      picker: this.data.picker,
      currentUserInfo: currentUserInfo
    })
    this.loadInfo()
    // 如果可用  是否可用从globalData 拿去userInfo
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
  loadInfo() {
    mcpRequest('user.info').then(res => {
      const { avatar, gender, height, nickname, danceAge, levelId, majorId, introduce, age } = res.data.userinfo
      this.data.obj = Object.assign({}, this.data.obj, { gender, height, nickname, danceAge, levelId, majorId, introduce, age })
      if (!this.data.isHead) {
        this.data.obj.avatar = avatar
      }
      this.setData({
        currentUserInfo: res.data.userinfo,
        obj: this.data.obj,
        nameLen: nickname.length > 8 ? 8 : nickname.length,
        areaLen: introduce ? introduce.length : 0
      })
      this.setDefaultPickValue()
    })
  },
  setDefaultPickValue() {
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
      if (item === this.data.obj.height) {
        this.data.pickValue.height = index
      }
    })
    if (this.data.obj.danceAge) {
      danceAge.forEach((item, index) => {
        if (item.toString() === this.data.obj.danceAge.toString()) {
          this.data.pickValue.danceAge = index
        }
      })
    }

    this.setData({
      pickValue: this.data.pickValue
    })
  },
  // 完成点击发送
  sendData() {
    wx.showLoading({
      title: '正在更新'
    })
    wx.nextTick(() => {
      if (this.data.headPromise) {
        this.data.headPromise.then(res => {
          this.uploadInfo()
        }).catch(() => {
          // this.uploadInfo()
          wx.showToast({
            title: '上传失败，重新选择头像',
            icon: 'none'
          })
        })
      } else {
        this.uploadInfo()
      }
    })
  },
  uploadInfo() {
    const params = Object.assign({}, this.data.obj)
    mcpRequest('user.updateInfo', params).then(res => {
      wx.hideLoading()
      wx.showToast({
        title: '更新成功',
        icon: 'success'
      })
      app.globalData.userInfo = res.currentUser.userinfo || {}
      wx.navigateBack({
        delta: 1
      })
    }).catch(() => {
      wx.hideLoading()
      wx.showToast({
        title: '更新失败',
        icon: 'none'
      })
    })
  },
  choseAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        // tempFilePath可以作为img标签的src属性显示图片
        const tempFilePaths = res.tempFilePaths[0]
        this.setData({
          'obj.avatar': tempFilePaths
        })
        // console.log(config)
        wx.redirectTo({
          url: `../upload/upload?src=${tempFilePaths}`
        })
      }
    })
  },

  uploadImg(tempFilePaths) {
    // 上传头像
    const req_cdata = {
      filename: tempFilePaths,
      resType: 10,
      // TODO height & width
      height: 0,
      width: 0
    }
    this.data.headPromise = new Promise((resolve, reject) => {
      wx.uploadFile({
        filePath: tempFilePaths, // 在此仅上传视频，实际业务中还要上传缩略图
        name: 'filenameKey',
        url: config.api, // 'http://apitest.dance798.com/mcp/api.json',
        // 构造form请求参数
        formData: mcpFormData('upload.uploadFile', req_cdata),
        success: res => {
          const resData = JSON.parse(res.data)
          if (resData.errorCode === 0) {
            // 设置头像地址
            this.data.obj.avatar = resData.data.filenameKey.resUrl
            this.setData({
              obj: this.data.obj
            })
            resolve()
          } else {
            wx.showToast({
              title: resData.errorMessage || '上传头像失败',
              icon: 'none'
            })
            reject()
          }
        },
        fail(err) {
          wx.showToast({
            title: err.errorMessage,
            icon: 'none'
          })
          reject()
        }
      })
    })
  },
  getValueLength: function(e) {
    const value = e.detail.value
    const len = parseInt(value.length)
    this.data.obj.nickname = value
    this.setData({
      obj: this.data.obj,
      nameLen: len // 当前字数
    })
  },
  // 填写年龄
  getAge(e) {
    this.data.obj.age = e.detail.value
    this.setData({
      obj: this.data.obj
    })
  },
  nicknameBlur(e) {
    this.data.obj.nickname = e.detail.value
    this.setData({
      obj: this.data.obj
    })
  },
  textareaAInput: function(e) {
    const value = e.detail.value
    this.data.obj.introduce = value
    const len = parseInt(value.length)
    this.setData({
      obj: this.data.obj,
      areaLen: len // 当前字数
    })
  },
  introduceBlur(e) {
    this.data.obj.introduce = e.detail.value
    this.setData({
      obj: this.data.obj
    })
  }
})
