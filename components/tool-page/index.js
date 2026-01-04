Component({
  properties: {
    title: {
      type: String,
      value: '工具',
    },
    desc: {
      type: String,
      value: '',
    },
    showBack: {
      type: Boolean,
      value: true,
    },
  },
  data: {
    statusBarHeight: 0,
  },
  lifetimes: {
    attached() {
      const systemInfo = wx.getSystemInfoSync();
      this.setData({
        statusBarHeight: systemInfo.statusBarHeight || 20,
      });
    },
  },
  methods: {
    goBack() {
      // 触发自定义返回事件，让页面有机会处理
      // 通过 detail 中的 preventDefault 让页面告诉组件是否阻止默认行为
      const eventDetail = { defaultPrevented: false };
      this.triggerEvent('back', eventDetail);
      
      // 如果页面没有阻止默认行为，则执行默认返回逻辑
      if (!eventDetail.defaultPrevented) {
        wx.navigateBack({
          fail: () => {
            wx.switchTab({
              url: '/pages/home/index',
            });
          },
        });
      }
    },
  },
});