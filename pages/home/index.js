import { tools } from '~/config/tools';

Page({
  /**
   * 分享给朋友
   */
  onShareAppMessage() {
    return {
      title: '🛠️ 发现一个超实用的工具箱！图片拼接、加水印、提取音频都有',
      path: '/pages/home/index',
      imageUrl: '/static/share/home.png',
    };
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline() {
    return {
      title: '实用工具箱 | 图片拼接、加水印、视频提取音频，好用到爆！',
      query: '',
      imageUrl: '/static/share/home.png',
    };
  },

  data: {
    toolList: [],
  },

  onLoad() {
    this.initData();
  },

  onShow() {
    // 设置 TabBar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        value: 'home',
      });
    }
  },

  initData() {
    this.setData({
      toolList: tools,
    });
  },

  // 点击工具
  onToolTap(e) {
    const { tool } = e.currentTarget.dataset;
    if (tool.path) {
      wx.navigateTo({
        url: tool.path,
        fail: (err) => {
          console.error('导航失败', err);
          wx.showToast({ title: '功能开发中', icon: 'none' });
        },
      });
    }
  },
});

