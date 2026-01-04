Page({
  /**
   * 分享给朋友
   */
  onShareAppMessage() {
    return {
      title: '📸 多图拼接太好用了！横向竖向宫格随心拼',
      path: '/pages/tools/image-collage/index',
      imageUrl: '/static/share/collage.png',
    };
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline() {
    return {
      title: '图片拼接神器 | 横向竖向宫格拼接，一键生成长图',
      query: '',
      imageUrl: '/static/share/collage.png',
    };
  },

  data: {
    images: [],
    maxImages: 9,
    layout: 'vertical', // vertical, horizontal, grid
    layouts: [
      { id: 'vertical', name: '竖向拼接', icon: 'view-list' },
      { id: 'horizontal', name: '横向拼接', icon: 'view-module' },
      { id: 'grid', name: '宫格拼接', icon: 'app' },
    ],
    gap: 0, // 图片间距
    gaps: [0, 5, 10, 20],
    bgColor: '#ffffff',
    bgColors: ['#ffffff', '#000000', '#f5f5f5', '#ffe4e1', '#e0f7fa', '#fff3e0'],
    resultPath: '',
    isProcessing: false,
    previewMode: false,
  },

  onLoad() {},

  // 处理返回按钮
  handleBack(e) {
    // 如果在预览模式，返回编辑模式
    if (this.data.previewMode) {
      this.exitPreview();
      e.detail.defaultPrevented = true; // 阻止默认返回行为
    }
    // 否则执行默认返回逻辑（不设置 defaultPrevented）
  },

  // 从相册选择图片
  chooseFromAlbum() {
    const remainCount = this.data.maxImages - this.data.images.length;
    if (remainCount <= 0) {
      wx.showToast({ title: `最多选择${this.data.maxImages}张图片`, icon: 'none' });
      return;
    }

    wx.chooseMedia({
      count: remainCount,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        this.addImages(res.tempFiles.map(f => f.tempFilePath));
      },
    });
  },

  // 从微信聊天选择图片
  chooseFromChat() {
    const remainCount = this.data.maxImages - this.data.images.length;
    if (remainCount <= 0) {
      wx.showToast({ title: `最多选择${this.data.maxImages}张图片`, icon: 'none' });
      return;
    }

    wx.chooseMessageFile({
      count: remainCount,
      type: 'image',
      success: (res) => {
        this.addImages(res.tempFiles.map(f => f.path));
      },
    });
  },

  // 添加图片
  async addImages(paths) {
    wx.showLoading({ title: '加载中...' });
    
    const newImages = [];
    for (const path of paths) {
      try {
        const info = await this.getImageInfo(path);
        newImages.push({
          path,
          width: info.width,
          height: info.height,
        });
      } catch (e) {
        console.error('获取图片信息失败', e);
      }
    }

    wx.hideLoading();
    
    this.setData({
      images: [...this.data.images, ...newImages],
      resultPath: '',
    });
  },

  // 获取图片信息
  getImageInfo(path) {
    return new Promise((resolve, reject) => {
      wx.getImageInfo({
        src: path,
        success: resolve,
        fail: reject,
      });
    });
  },

  // 删除图片
  removeImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = [...this.data.images];
    images.splice(index, 1);
    this.setData({ images, resultPath: '' });
  },

  // 移动图片顺序
  moveImage(e) {
    const { index, direction } = e.currentTarget.dataset;
    const images = [...this.data.images];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= images.length) return;
    
    [images[index], images[newIndex]] = [images[newIndex], images[index]];
    this.setData({ images, resultPath: '' });
  },

  // 切换布局
  switchLayout(e) {
    const layout = e.currentTarget.dataset.layout;
    this.setData({ layout, resultPath: '' });
  },

  // 切换间距
  switchGap(e) {
    const gap = e.currentTarget.dataset.gap;
    this.setData({ gap, resultPath: '' });
  },

  // 切换背景色
  switchBgColor(e) {
    const bgColor = e.currentTarget.dataset.color;
    this.setData({ bgColor, resultPath: '' });
  },

  // 开始拼接
  async startCollage() {
    if (this.data.images.length < 2) {
      wx.showToast({ title: '请至少选择2张图片', icon: 'none' });
      return;
    }

    this.setData({ isProcessing: true });
    wx.showLoading({ title: '拼接中...' });

    try {
      const result = await this.generateCollage();
      this.setData({
        resultPath: result,
        isProcessing: false,
        previewMode: true,
      });
      wx.hideLoading();
      wx.showToast({ title: '拼接完成', icon: 'success' });
    } catch (error) {
      wx.hideLoading();
      this.setData({ isProcessing: false });
      wx.showToast({ title: '拼接失败', icon: 'none' });
      console.error('拼接失败', error);
    }
  },

  // 生成拼接图片
  generateCollage() {
    return new Promise((resolve, reject) => {
      const query = wx.createSelectorQuery();
      query.select('#collageCanvas')
        .fields({ node: true, size: true })
        .exec(async (res) => {
          if (!res[0]) {
            reject(new Error('Canvas not found'));
            return;
          }

          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const { images, layout, gap, bgColor } = this.data;
          const dpr = wx.getSystemInfoSync().pixelRatio;

          // 计算画布尺寸
          let canvasWidth, canvasHeight;
          const baseSize = 1080; // 基础尺寸

          if (layout === 'vertical') {
            // 竖向拼接：宽度统一，高度累加
            canvasWidth = baseSize;
            const totalHeight = images.reduce((sum, img) => {
              return sum + (baseSize / img.width) * img.height;
            }, 0);
            canvasHeight = totalHeight + gap * (images.length - 1);
          } else if (layout === 'horizontal') {
            // 横向拼接：高度统一，宽度累加
            const minHeight = Math.min(...images.map(img => img.height));
            canvasHeight = Math.min(baseSize, minHeight);
            const totalWidth = images.reduce((sum, img) => {
              return sum + (canvasHeight / img.height) * img.width;
            }, 0);
            canvasWidth = totalWidth + gap * (images.length - 1);
          } else {
            // 宫格拼接
            const cols = Math.ceil(Math.sqrt(images.length));
            const rows = Math.ceil(images.length / cols);
            const cellSize = Math.floor(baseSize / cols);
            canvasWidth = cellSize * cols + gap * (cols - 1);
            canvasHeight = cellSize * rows + gap * (rows - 1);
          }

          // 设置画布尺寸
          canvas.width = canvasWidth;
          canvas.height = canvasHeight;

          // 绘制背景
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);

          // 加载并绘制图片
          let currentX = 0;
          let currentY = 0;

          for (let i = 0; i < images.length; i++) {
            const img = images[i];
            const image = canvas.createImage();
            
            await new Promise((resolveImg) => {
              image.onload = () => {
                let drawWidth, drawHeight, drawX, drawY;

                if (layout === 'vertical') {
                  drawWidth = canvasWidth;
                  drawHeight = (canvasWidth / img.width) * img.height;
                  drawX = 0;
                  drawY = currentY;
                  currentY += drawHeight + gap;
                } else if (layout === 'horizontal') {
                  drawHeight = canvasHeight;
                  drawWidth = (canvasHeight / img.height) * img.width;
                  drawX = currentX;
                  drawY = 0;
                  currentX += drawWidth + gap;
                } else {
                  // 宫格
                  const cols = Math.ceil(Math.sqrt(images.length));
                  const cellSize = Math.floor(baseSize / cols);
                  const col = i % cols;
                  const row = Math.floor(i / cols);
                  drawX = col * (cellSize + gap);
                  drawY = row * (cellSize + gap);
                  drawWidth = cellSize;
                  drawHeight = cellSize;
                }

                ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
                resolveImg();
              };
              image.onerror = resolveImg;
              image.src = img.path;
            });
          }

          // 导出图片
          setTimeout(() => {
            wx.canvasToTempFilePath({
              canvas,
              fileType: 'jpg',
              quality: 1,
              success: (res) => {
                console.log('Canvas 导出成功，路径:', res.tempFilePath);
                resolve(res.tempFilePath);
              },
              fail: (err) => {
                console.error('Canvas 导出失败:', err);
                reject(err);
              },
            });
          }, 100);
        });
    });
  },

  // 退出预览
  exitPreview() {
    this.setData({ previewMode: false });
  },

  // 保存图片
  async saveImage() {
    if (this.data.images.length < 2) {
      wx.showToast({ title: '请至少选择2张图片', icon: 'none' });
      return;
    }

    // 先检查授权状态
    const authResult = await this.checkPhotoAuth();
    if (!authResult) {
      return; // 需要授权，已经弹出授权提示
    }

    // 重新生成图片并保存
    wx.showLoading({ title: '保存中...' });
    
    try {
      const tempFilePath = await this.generateCollage();
      console.log('重新生成图片路径:', tempFilePath);
      
      // 直接保存新生成的图片
      wx.saveImageToPhotosAlbum({
        filePath: tempFilePath,
        success: () => {
          wx.hideLoading();
          console.log('保存成功');
          wx.showToast({ title: '保存成功', icon: 'success' });
        },
        fail: (err) => {
          wx.hideLoading();
          console.error('保存失败，完整错误信息:', err);
          
          if (err.errMsg.includes('auth deny') || err.errMsg.includes('authorize')) {
            wx.showModal({
              title: '提示',
              content: '需要您授权保存图片到相册',
              confirmText: '去授权',
              success: (res) => {
                if (res.confirm) {
                  wx.openSetting();
                }
              },
            });
          } else {
            wx.showToast({ title: `保存失败: ${err.errMsg}`, icon: 'none', duration: 3000 });
          }
        },
      });
    } catch (error) {
      wx.hideLoading();
      console.error('生成图片失败:', error);
      wx.showToast({ title: '生成图片失败，请重试', icon: 'none' });
    }
  },

  // 检查相册授权
  checkPhotoAuth() {
    return new Promise((resolve) => {
      wx.getSetting({
        success: (res) => {
          if (res.authSetting['scope.writePhotosAlbum'] === false) {
            // 用户之前拒绝过授权
            wx.showModal({
              title: '提示',
              content: '需要您授权保存图片到相册',
              confirmText: '去授权',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  wx.openSetting({
                    success: (settingRes) => {
                      resolve(settingRes.authSetting['scope.writePhotosAlbum'] === true);
                    },
                    fail: () => resolve(false)
                  });
                } else {
                  resolve(false);
                }
              },
            });
          } else {
            // 未授权或已授权
            resolve(true);
          }
        },
        fail: () => {
          // 获取设置失败，尝试继续
          resolve(true);
        }
      });
    });
  },

  // 分享图片
  shareImage() {
    if (!this.data.resultPath) return;
    
    wx.showShareImageMenu({
      path: this.data.resultPath,
      fail: () => {
        wx.showToast({ title: '分享失败', icon: 'none' });
      },
    });
  },

  // 清除所有
  clearAll() {
    wx.showModal({
      title: '提示',
      content: '确定要清除所有图片吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            images: [],
            resultPath: '',
            previewMode: false,
          });
        }
      },
    });
  },
});