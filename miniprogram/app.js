// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        console.log('登录成功', res.code)
      }
    })
  },
  
  globalData: {
    userInfo: null,
    // 应用全局状态
    appState: {
      currentTab: 'body',
      currentCategory: 'panda',
      selectedBody: null,
      selectedExpression: null,
      textContent: '',
      textColor: '#000000',
      strokeEnabled: true,
      strokeColor: '#ffffff',
      layerTransforms: {
        body: { x: 0, y: 0, scale: 1, rotation: 0, flipX: false },
        expression: { x: 0, y: 0, scale: 1, rotation: 0, flipX: false },
        text: { x: 0, y: 0, scale: 1, rotation: 0, flipX: false }
      }
    }
  }
})
