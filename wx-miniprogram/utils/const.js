const WxNotificationCenter = require("../libs/WxNotificationCenter/WxNotificationCenter");

module.exports = {
  notification: {
    login: 'login',
    logout: 'logout',
    follow: 'follow',
    unfollow: 'unfollow',
    like: 'like',
    unlike: 'unlike',
    doubleTap: 'doubleTap',
    readMessage: 'readMessage',
    messageText: 'messageText'
  },

  ugc: {
    status_published: 40
  },

  systemInfo: wx.getSystemInfoSync()
}
