// pages/message/chat/chat.js
import mcpRequest, { mcpFormData } from '../../../utils/mcp'
import config from '../../../utils/config'
import {
  formatTime,
  showLoading
} from '../../../utils/util'

import constants from '../../../utils/const'
import wxNotificationCenter from '../../../libs/WxNotificationCenter/WxNotificationCenter'
const app = getApp()

Page({

  data: {
    InputBottom: 0,
    params: {
      pageSize: 20,
      tailFlag: 0
    },
    hasNext: false,
    targetUserId: '',
    dialogKey: '',
    myUserInfo: {},
    otherUserInfo: {},
    list: [],
    // 发送的 内容
    textInfo: '',
    inputValue: '',
    userBanInfo: {},
    systemInfo: wx.getSystemInfoSync()
  },

  onLoad(options) {
    var targetUserId = options.targetUserId
    this.setData({
      targetUserId: targetUserId,
      userBanInfo: app.globalData.userBanInfo
    })
    this.getUserInfo(targetUserId)

    // 定时拉取新消息
    this.loopNewMessages()
  },

  onUnload(options) {
    // 页面卸载后，同时也要清除定时任务，避免狂刷新
    if (this.data.intervalId) {
      clearInterval(this.data.intervalId)
    }
  },

  formatTime(time) {
    return formatTime(new Date(time))
  },

  /**
   * 获取会话信息
   * @param {*} targetUserId
   */
  getUserInfo(targetUserId) {
    mcpRequest('message.dialogOpen', {
      targetUserId
    }).then(res => {
      let myUserInfo, otherUserInfo
      res.data.members.forEach(item => {
        if (item.userinfo.isSelf) {
          myUserInfo = item.userinfo
        } else {
          otherUserInfo = item.userinfo
        }
      })
      this.setData({
        dialogKey: res.data.dialogKey,
        myUserInfo,
        otherUserInfo
      })
      // 获取列表
      this.getHistoryMessageList(true)
    })
  },

  /**
   * 获取历史聊天消息记录
   */
  getHistoryMessageList(refresh) {
    const obj = Object.assign({}, {
      dialogKey: this.data.dialogKey
    }, this.data.params)
    // wx.showLoading({ title: "数据加载中" });
    showLoading()
    mcpRequest('message.messages', obj).then(res => {
      // 发送读消息的通知，放在合适的位置（确保后台已经清除过未读消息数）
      wxNotificationCenter.postNotificationName(constants.notification.readMessage)

      res.data.dataList.forEach(item => {
        if (item.actionTimeMillis) {
          item.timeText = this.formatTime(item.actionTimeMillis)
        }
      })

      // TODO, 排序，确保新消息在后
      for (var i = 0; i < res.data.dataList.length; i++) {
        // 添加消息
        this.data.list.unshift(res.data.dataList[i])
      }

      this.setData({
        list: this.data.list,
        hasNext: res.data.hasNext,
        'params.tailFlag': res.data.tailFlag
      })
      if (refresh) {
        // 第一次获取时，滚动到页面底部（加载历史消息，无需进行滚动）
        this.pageScrollToBottom()
      }
      wx.hideLoading()
    })
  },

  /**
  * 获取新聊天消息记录
  */
  getNewMessageList() {
    if (this.data.list.length === 0) {
      return
    }
    const newMsgCursor = this.data.list[this.data.list.length - 1].actionTimeMillis
    const obj = {
      dialogKey: this.data.dialogKey,
      tailFlag: newMsgCursor
    }
    mcpRequest('message.newMessages', obj).then(res => {
      // 发送读消息的通知，放在合适的位置（确保后台已经清除过未读消息数）
      wxNotificationCenter.postNotificationName(constants.notification.readMessage)

      res.data.dataList.forEach(item => {
        if (item.actionTimeMillis) {
          item.timeText = this.formatTime(item.actionTimeMillis)
        }
      })
      // TODO, 排序，确保新消息在后
      for (var i = 0; i < res.data.dataList.length; i++) {
        // 添加消息
        this.data.list.push(res.data.dataList[i])
      }
      this.setData({
        list: this.data.list,
        'params.newMsgTailFlag': res.data.tailFlag
      })
    })
  },

  /**
   * 定时获取未读消息数
   */
  loopNewMessages: function() {
    // 定时加载
    var intervalId = setInterval(this.getNewMessageList, 10 * 1000)
    // 保存定时任务id，供页面卸载时清除
    this.data.intervalId = intervalId
  },
  InputFocus(e) {
    this.setData({
      InputBottom: e.detail.height
    })
  },
  InputBlur(e) {
    this.setData({
      InputBottom: 0
    })
  },
  onReachBottom() {
    // if (this.data.hasNext) {
    //   this.getHistoryMessageList()
    // }
  },
  inputText(e) {
    this.setData({
      textInfo: e.detail.value
    })
  },
  // 选择图片
  choseImg() {
    const that = this
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      sizeType: ['compressed'],
      success(res) {
        // 获取视频资源
        const imageTempFile = res.tempFiles[0]
        const imageTempFilePath = imageTempFile.tempFilePath
        const width = 0// imageTempFile.width;
        const height = 0// imageTempFile.height;

        // 真实业务中上应该只选择并记录tempFilePath，在发布界面填写完毕后，先执行上传，再执行发布
        // 上传缩略图
        // 获取视频缩略图（首帧图片）
        // let imageThumbTempFilePath = imageTempFile.thumbTempFilePath;

        const req_cdata = {
          filename: imageTempFilePath,
          resType: 10,
          height: height,
          width: width
        }
        // const req_cdata = "{filename: '" + imageTempFilePath + "', resType:10,  height:" + height + ', width:' + width + '}'
        wx.uploadFile({
          filePath: imageTempFilePath, // 在此上传图片
          name: 'filenameKey',
          url: config.api,
          // 构造form请求参数，
          formData: mcpFormData('upload.uploadFile', req_cdata),
          success(res) {
            const mcpResObj = JSON.parse(res.data)
            // TODO 判断响应成功or失败
            // pageData.coverResId = mcpResObj.data.filenameKey.id;
            const params = {
              'dialogKey': that.data.dialogKey,
              'msgType': 'image', // 视频描述
              'resId': mcpResObj.data.filenameKey.id // 视频资源id，需要先上传获取
            }
            // 调用发布api
            mcpRequest('message.send', params).then(res => {
              //  TODO 如何获取最新数据  有待规划
              res.data.timeText = that.formatTime(res.data.actionTimeMillis)
              that.data.list.push(res.data)
              that.setData({
                list: that.data.list
              })
              // 消息成功发送后，滚动到最底部，有bug
              that.pageScrollToBottom()
            })
          },
          fail(err) {
            console.log('==上传失败==', err)
          }
        })
      }
    })
  },
  sendData() {
    this.data.textInfo = this.data.textInfo.trim()
    this.setData({
      textInfo: this.data.textInfo
    })
    if (!this.data.textInfo.trim()) {
      wx.showToast({
        title: '消息不能为空',
        icon: 'none'
      })
      return
    }
    mcpRequest('message.send', {
      dialogKey: this.data.dialogKey,
      content: this.data.textInfo,
      msgType: 'text'
    }).then(res => {
      //  TODO 如何获取最新数据  有待规划
      res.data.timeText = this.formatTime(res.data.actionTimeMillis)
      this.data.list.push(res.data)
      this.setData({
        inputValue: '', // 清除输入框
        list: this.data.list
      })
      // 消息成功发送后，滚动到最底部
      this.pageScrollToBottom()
    }).catch(err => {
      wx.showToast({
        title: err.errorMessage || '系统错误'
      })
    })
  },

  // 获取容器高度，使页面滚动到容器底部
  pageScrollToBottom: function() {
    setTimeout(() => {
      wx.createSelectorQuery().select('#j_page').boundingClientRect((rect) => {
        let height = rect.bottom > rect.height ? rect.bottom : rect.height
        // 如果页面内容 小于屏幕内容  则不需要滑动
        height = height < this.data.systemInfo.windowHeight ? 0 : height
        // 使页面滚动到底部
        wx.pageScrollTo({
          scrollTop: height,
          duration: 0
        })
      }).exec()
    }, 0)
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   * 下拉刷新
   */
  onPullDownRefresh: function() {
    if (this.data.hasNext) {
      this.getHistoryMessageList(false)
    }
  },

  /**
   * 预览图片
   */
  previewImage(e) {
    wx.previewImage({
      urls: [e.currentTarget.dataset.resurl]
    })
  }

})
