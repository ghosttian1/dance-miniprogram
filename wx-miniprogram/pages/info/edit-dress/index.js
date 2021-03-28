// pages/info/edit-dress/index.js
import mcpRequest, { mcpFormData } from '../../../utils/mcp'
import config from '../../../utils/config'

const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    title: '',
    titleLen: 0,
    areaLen: 0,
    comment: '',
    imgList: [],
    // 外面显示价格
    showPrice: null,
    // 弹框价格
    price: '',
    priceModal: false,
    tagActive: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.setData({
      currentCity: app.globalData.currentCity,
      clothesType: app.globalData.clothesType
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
    mcpRequest('comment.transfer.info', { id }).then(res => {
      const { title, comment, price, majorId, originalPrice } = res.data.commentTransfer
      const list = res.data.assetsList
      const imgList = []
      list.forEach(item => {
        imgList.push(item.resourceUrl)
      })
      this.setData({
        title,
        comment: comment || '',
        price: price / 100,
        originPrice: originalPrice / 100,
        commentTransfer: res.data.commentTransfer,
        userInfo: res.data.userProfile.userinfo,
        enableRefresh: res.data.enableRefresh,
        imgList,
        tempList: list,
        titleLen: title.length,
        areaLen: comment.length,
        showPrice: price / 100
      })
      this.setDefaultPicker(majorId)
    })
  },

  // 设置默认选中标签
  setDefaultPicker(majorId) {
    this.data.clothesType.forEach((item, index) => {
      if (item.code === majorId) {
        this.setData({
          tagActive: index
        })
      }
    })
  },

  // title÷
  titleInput(e) {
    let value = e.detail.value
    value = value.trim()
    this.setData({
      title: value
    })
  },
  setTitleLen(e) {
    const value = e.detail.value
    const len = parseInt(value.length)
    // 最多字数限制
    this.setData({
      titleLen: len || 0// 当前字数
    })
  },
  // 商品信息
  textareaAInput: function(e) {
    const value = e.detail.value
    const len = parseInt(value.length)
    // 最多字数限制
    this.setData({
      comment: value,
      areaLen: len || 0// 当前字数
    })
  },
  textareaBlur(e) {
    const value = e.detail.value
    this.setData({
      comment: value
    })
  },
  infoFocus() {
    // if (!this.data.comment) {
    //   this.setData({
    //     comment: '商品描述：'
    //   })
    // }
  },

  ChooseImage() {
    wx.chooseImage({
      count: 9 - this.data.imgList.length, // 默认9
      sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album'], // 从相册选择
      success: (res) => {
        if (this.data.imgList.length !== 0) {
          this.setData({
            imgList: this.data.imgList.concat(res.tempFilePaths),
            tempList: this.data.tempList.concat(res.tempFilePaths)
          })
        } else {
          this.setData({
            imgList: res.tempFilePaths,
            tempList: res.tempFilePaths
          })
        }
      }
    })
  },
  ViewImage(e) {
    wx.previewImage({
      urls: this.data.imgList,
      current: e.currentTarget.dataset.url
    })
  },
  DelImg(e) {
    wx.showModal({
      title: '提示',
      content: '确定要删除吗？',
      cancelText: '再看看',
      confirmText: '删除',
      success: res => {
        if (res.confirm) {
          this.data.imgList.splice(e.currentTarget.dataset.index, 1)
          this.data.tempList.splice(e.currentTarget.dataset.index, 1)
          this.setData({
            imgList: this.data.imgList,
            tempList: this.data.tempList
          })
        }
      }
    })
  },

  // 打开价格弹框
  openPriceModal() {
    this.setData({
      priceModal: true
    })
  },
  // 关闭价格弹框
  hidePriceModal() {
    this.setData({
      showPrice: this.data.price,
      priceModal: false
    })
    wx.hideKeyboard()
  },
  changeShowPrice() {
    this.setData({
      showPrice: this.data.price,
      priceModal: false
    })
    wx.hideKeyboard()
  },

  // 售价
  priceInput(e) {
    let value = e.detail.value
    if (value < 0) {
      value = 0
    } else if (value > 50000) {
      value = 50000
    }
    this.setData({
      price: value
    })
  },
  // 原价
  originPriceInput(e) {
    let value = e.detail.value
    if (value < 0) {
      value = 0
    } else if (value > 50000) {
      value = 50000
    }
    this.setData({
      originPrice: value
    })
  },

  // 标签点击切换状态
  switchTagStatus(e) {
    const index = e.currentTarget.dataset.index
    this.setData({
      'tagActive': index
    })
  },

  // 发布内容
  publish() {
    wx.nextTick(() => {
      let msg = ''
      if (this.data.title.length === 0) {
        msg = '商品名称不能为空'
      } else if (this.data.comment.length === 0) {
        msg = '描述不能为空'
      } else if (this.data.imgList.length === 0) {
        msg = '图片不能为空'
      } else if (this.data.price === '') {
        msg = '售价不能为空'
      } else if (this.data.tagActive === null) {
        msg = '请添加选择标签'
      }
      if (msg) {
        wx.showToast({
          title: msg,
          icon: 'none'
        })
        return
      }
      wx.showLoading({
        title: '数据发送中'
      })
      const assetsList = []
      const p = []
      this.data.imgList.forEach((item, index) => {
        if (item.indexOf('//tmp/wx') !== -1 || item.indexOf('wxfile://tmp_') !== -1) {
          // 临时图片才需要上传
          const pp = new Promise((resolve, reject) => {
            // console.log("=====item===", item);
            wx.uploadFile({
              filePath: item,
              name: 'filename',
              url: config.api,
              formData: mcpFormData('upload.uploadFile', {
                filename: item,
                resType: 10 // 资源类型，0文件，10图片，20视频，头像多少？
              }),
              success: (res) => {
                try {
                  const resData = JSON.parse(res.data)
                  if (resData.errorCode === 0) {
                    assetsList[index] = { resourceUrl: resData.data.filename.resUrl, assetsId: resData.data.filename.id }
                  }
                  resolve()
                } catch (error) {
                  reject()
                }
              },
              fail: (err) => {
                reject(err)
              }
            })
          })
          p.push(pp)
        } else {
          assetsList[index] = this.data.tempList[index]
        }
      })
      Promise.all(p).then(res => {
        const requestData = {
          'commentTransfer': {
            'title': this.data.title,
            'comment': this.data.comment,
            'cityCode': this.data.currentCity.code,
            'price': this.data.price * 100, // 售价，单位：分
            'originalPrice': this.data.originPrice * 100, // 原价，单位：分
            'majorId': this.data.clothesType[this.data.tagActive].code// 赛服类型
          },
          'assetsList': assetsList
        }
        this.data.isEdit ? requestData.commentTransfer.id = this.data.commentTransfer.id : ''
        mcpRequest('comment.transfer.publish', requestData).then(res => {
          const title = this.data.isEdit ? '更新成功' : '发布成功'
          wx.hideLoading()
          wx.showToast({
            title: title,
            icon: 'success'
          })
          wx.navigateBack({
            delta: 1
          })
        }).catch(() => {
          const title = this.data.isEdit ? '更新失败' : '发布失败'
          wx.hideLoading()
          wx.showToast({
            title: title,
            icon: 'none'
          })
        })
      }).catch(() => {
        wx.hideLoading()
        wx.showToast({
          title: '上传错误',
          icon: 'none'
        })
      })
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  oneady: function() {
  },

  /**
   * 生命周期函数--监听页面显示
   */
  oShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  oHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownReresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBttom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMesage: function() {

  }
})
