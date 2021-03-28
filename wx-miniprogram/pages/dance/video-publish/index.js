// pages/dance/video-publish/index.js
// pages/profile/fans/fans.js
import mcp, { mcpFormData } from '../../../utils/mcp'
import config from '../../../utils/config'
const app = getApp()

Page({

  // 上传，发布缺少loading框的ui

  /**
   * 页面的初始数据
   */
  data: {
    agree: true,
    areaLen: 0,
    title: '',
    topic: '',
    video: '',
    videoResId: 0, // 视频资源id
    coverResId: 0, // 封面资源id
    tagArr: [], // 发布时的标签
    videoPromise: null,
    userBanInfo: {}
  },

  inputSign() {
    this.data.title += '#'
    const len = parseInt(this.data.title.length)
    this.setData({
      areaLen: len || 0, // 当前字数
      title: this.data.title
    })
  },
  /**
   * 上传视频操作
   */
  addVideo() {
    const pageData = this.data
    this.data.videoPromise = new Promise((resolve, reject) => {
      wx.chooseMedia({
        mediaType: ['video'],
        sourceType: ['album'],
        success: res => {
          // 获取视频资源
          const videoTempFile = res.tempFiles[0]
          const videoTempFilePath = videoTempFile.tempFilePath
          const width = videoTempFile.width
          const height = videoTempFile.height
          const duration = videoTempFile.duration
          // const size = videoTempFile.size
          if (duration > 122) {
            wx.showToast({
              title: '视频时长超限，建议选择2分钟以下的视频',
              icon: 'none'
            })
            return
          }

          this.setData({
            video: videoTempFilePath
          })

          // 上传视频
          const video_cdata_obj = {
            filename: videoTempFilePath,
            resType: 20,
            width: width,
            height: height,
            duration: Math.round(duration * 1000)
          }

          wx.uploadFile({
            filePath: videoTempFilePath, // 在此仅上传视频，实际业务中还要上传缩略图
            name: 'filenameKey',
            url: config.api,
            // 构造form请求参数，
            formData: mcpFormData('upload.uploadFile', video_cdata_obj),
            success: res => {
              const mcpResObj = JSON.parse(res.data)
              console.log(mcpResObj, pageData)
              if (mcpResObj.errorCode === 0) {
                this.data.videoResId = mcpResObj.data.filenameKey.id
                resolve()
              } else {
                wx.showToast({
                  title: '上传错误',
                  icon: 'none'
                })
                this.setData({
                  video: ''
                })
                reject()
              }
            },
            fail(err) {
              console.log('==上传失败==', err)
              reject()
            }
          })

          // 上传缩略图
          // 获取视频缩略图（首帧图片）
          const videoThumbTempFilePath = videoTempFile.thumbTempFilePath
          const thumb_cdata_obj = {
            filename: videoThumbTempFilePath,
            resType: 10,
            width: width,
            height: height
          }

          // console.log('===thumb_cdata===', thumb_cdata_obj)

          wx.uploadFile({
            filePath: videoThumbTempFilePath,
            name: 'filenameKey',
            url: config.api,
            // 构造form请求参数，
            formData: mcpFormData('upload.uploadFile', thumb_cdata_obj),
            success: res => {
              const mcpResObj = JSON.parse(res.data)
              if (mcpResObj.errorCode === 0) {
                this.data.coverResId = mcpResObj.data.filenameKey.id
              } else {
                wx.showToast({
                  title: '上传错误',
                  icon: 'none'
                })
                this.setData({
                  video: ''
                })
              }
            },
            fail(err) {
              console.log('==上传失败==', err)
            }
          })
        },
        fail: (err) => {
          if (err.errMsg === 'chooseMedia:fail cancel') {
            // 用户取消
          } else {
            wx.showToast({
              title: '上传错误'
            })
          }
        }
      })
    })
  },

  /**
   * 发布视频
   * @param {*} e
   */
  publish(e) {
    if (!this.data.agree) {
      wx.showToast({
        title: '请勾选协议',
        icon: 'none'
      })
      return
    }
    if (!this.data.videoPromise) {
      wx.showToast({
        title: '请添加内容',
        icon: 'none'
      })
      return
    }
    wx.showLoading({
      title: '上传中...'
    })
    this.data.videoPromise.then(res => {
      // 校验视频参数
      if (this.data.videoResId <= 0 || this.data.coverResId <= 0) {
        wx.showToast({
          title: '请选择要发布的视频~',
          icon: 'none'
        })
        wx.hideLoading()
        return
      }
      const params = {
        'content': this.data.title, // 视频描述
        'videoResId': this.data.videoResId, // 视频资源id，需要先上传获取
        'coverResId': this.data.coverResId, // 视频封面图资源id，需要先上传获取
        'tag': this.data.tagArr // 标签内容
      }
      // 调用发布api
      mcp('ugc.post', params).then(res => {
        wx.showToast({
          title: '视频发布成功'
        })
        // 发布成功 返回到个人中心
        wx.switchTab({
          url: '/pages/profile/myhome/myhome'
        })
      }).catch(() => {
        wx.hideLoading()
      })
    }).catch(() => {
      wx.hideLoading()
    })
  },

  titleInput(e) {
    const value = e.detail.value
    const len = parseInt(value.length)
    // 最多字数限制
    this.setData({
      title: e.detail.value,
      areaLen: len || 0 // 当前字数
    })
  },
  titleBlur(e) {
    // this.setData({
    //   title: e.detail.value
    // })
  },

  checkChange(e) {
    const agree = !!e.detail.value.length
    this.setData({
      agree: agree
    })
  },

  tagInput(e) {
    this.setData({
      topic: e.detail.value
    })
    const arr = e.detail.value.split('#')
    const tagArr = []
    arr.forEach(item => {
      item = item.trim()
      if (item) {
        tagArr.push(item)
      }
    })
    this.data.tagArr = tagArr
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.setData({
      userBanInfo: app.globalData.userBanInfo
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})
