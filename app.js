// app.js

App({
  onLaunch() {
    // 检查更新
    this.checkForUpdate();
  },

  // 检查小程序更新
  checkForUpdate() {
    // 判断微信版本是否支持更新管理器
    if (!wx.canIUse('getUpdateManager')) {
      console.log('当前微信版本过低，无法使用更新功能');
      return;
    }

    const updateManager = wx.getUpdateManager();

    // 检查更新
    updateManager.onCheckForUpdate((res) => {
      console.log('检查更新结果:', res);
      if (res.hasUpdate) {
        console.log('发现新版本，正在下载...');
      } else {
        console.log('已是最新版本');
      }
    });

    // 新版本下载完成
    updateManager.onUpdateReady(() => {
      console.log('新版本下载完成');
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        confirmText: '立即重启',
        cancelText: '稍后',
        success(res) {
          if (res.confirm) {
            // 应用新版本并重启
            updateManager.applyUpdate();
          }
        },
      });
    });

    // 新版本下载失败
    updateManager.onUpdateFailed(() => {
      console.error('新版本下载失败');
      wx.showModal({
        title: '更新失败',
        content: '新版本下载失败，请检查网络后重启小程序重试',
        showCancel: false,
      });
    });
  },

  globalData: {
    userInfo: null,
  },
});