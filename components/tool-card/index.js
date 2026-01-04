Component({
  properties: {
    tool: {
      type: Object,
      value: {},
    },
    size: {
      type: String,
      value: 'normal', // normal | small | large
    },
  },
  data: {},
  methods: {
    onTap() {
      const { tool } = this.properties;
      
      if (!tool || !tool.path) {
        wx.showToast({
          title: '工具配置错误',
          icon: 'none',
        });
        return;
      }

      wx.navigateTo({
        url: tool.path,
        fail: (err) => {
          console.error('导航失败:', tool.path, err);
          wx.showToast({
            title: '页面不存在',
            icon: 'none',
          });
        },
      });
    },
  },
});
