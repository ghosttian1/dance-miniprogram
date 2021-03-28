import { systemInfo } from "./const";
// const app = getApp();

const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const parseTime = (time, cFormat) => {
  if (time === undefined) {
    return null
  }
  const format = cFormat || 'yyyy-MM-dd HH:mm:ss'
  let date
  if (typeof time === 'object') {
    date = time
  } else {
    if ((typeof time === 'string') && (/^[0-9]+$/.test(time))) {
      time = parseInt(time)
    }
    if ((typeof time === 'number') && (time.toString().length === 10)) {
      time = time * 1000
    }
    date = new Date(time)
  }
  const formatObj = {
    y: date.getFullYear(),
    M: date.getMonth() + 1,
    d: date.getDate(),
    H: date.getHours(),
    m: date.getMinutes(),
    s: date.getSeconds(),
    a: date.getDay()
  }
  const time_str = format.replace(/([yMdHmsa])+/g, (result, key) => {
    const value = formatObj[key]
    // Note: getDay() returns 0 on Sunday
    if (key === 'a') { return ['日', '一', '二', '三', '四', '五', '六'][value] }
    return value.toString().padStart(2, '0')
  })
  return time_str
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

const isObject = obj => {
  return Object.prototype.toString.call(obj) === '[object Object]'
}

/**
 * 加载中
 * @param {}} obj
 */
const showLoading = (obj) => {
  let title = '数据加载中'
  if (obj && obj.title) {
    title = obj.title
  }
  return wx.showLoading({ 'title': title })
}

/**
 * 关闭加载中
 * @param {}} obj
 */
const hideLoading = () => {
  return wx.hideLoading()
}

/**
 * 打开微信分享
 * @param {*} obj
 */
const showShareMenu = (obj) => {
  wx.showShareMenu({
    menus: ['shareAppMessage', 'shareTimeline']
  })
}


/**
 * 隐藏微信分享
 * @param {*} obj
 */
const hideShareMenu = (obj) => {
  wx.hideShareMenu({
    menus: ['shareAppMessage', 'shareTimeline']
  })
}


/**
 * 判断是否是ios
 * @param {*} obj
 */
const isIOS = () => {
  // console.log("==systemInfo===", systemInfo.platform);
  return systemInfo.platform === 'ios';
}


module.exports = {
  showShareMenu: showShareMenu,
  hideShareMenu: hideShareMenu,
  showLoading: showLoading,
  hideLoading: hideLoading,
  formatTime: formatTime,
  isObject,
  parseTime,
  isIOS
}
