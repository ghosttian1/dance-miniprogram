import mcpRequest from './mcp'

/**
 * 构造分享配置
 * @param {*} data 
 * @param {*} shareTargetUrl 着陆页后，跳转的二级页面地址，为空则表示无需跳转二级页面
 * @param {*} shareMainPath 分享后的小程序地址首页的tab path
 */
export function getShareConfig(data, shareTargetUrl = null, shareMainPath = '') {
  return mcpRequest('share.config', data).then(res => {
    const shareData = res.data

    if (shareMainPath == '') {
      //默认分享着陆页为首页
      shareMainPath = '/pages/dance/main/main'
      // shareMainPath = '/pages/info/home/home'
    }
    let fullSharePath = shareMainPath + "?";
    if (shareTargetUrl) {
      const encodedshareTargetUrl = encodeURIComponent(shareTargetUrl)
      fullSharePath = fullSharePath + '&redirectUrl=' + encodedshareTargetUrl;
    }
    // let fullSharePath = '/pages/index/index?' + shareMainPath;
    // if (shareTargetUrl) {
    //   const encodedshareTargetUrl = encodeURIComponent(shareTargetUrl)
    //   fullSharePath = fullSharePath + '&redirectUrl=' + encodedshareTargetUrl;
    // }
    shareData.path = fullSharePath;

    // console.log("shareData", shareData);

    return res
  }).catch(() => {
    // wx.showToast({
    //   title: '获取分享配置失败',
    //   icon: 'none'
    // })
    console.log('获取分享配置失败');
  })
}

/**
 * 分享
 * @param {*} redirectUrl 
 */
export function shareRedirect(redirectUrl) {
  if (redirectUrl) {
    redirectUrl = decodeURIComponent(redirectUrl)
    wx.navigateTo({
      url: redirectUrl
    })
  }
}


