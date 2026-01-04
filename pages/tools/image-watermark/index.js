Page({
  /**
   * 分享给朋友
   */
  onShareAppMessage() {
    return {
      title: '🎨 图片加水印神器！保护版权就靠它',
      path: '/pages/tools/image-watermark/index',
      imageUrl: '/static/share/watermark.png',
    };
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline() {
    return {
      title: '图片加水印神器 | 一键添加专属水印，保护你的原创作品',
      query: '',
      imageUrl: '/static/share/watermark.png',
    };
  },

  data: {
    // 图片
    imagePath: '',
    imageWidth: 0,
    imageHeight: 0,
    
    // 预览区域尺寸
    previewWidth: 0,
    previewHeight: 0,
    
    // 水印设置
    watermarkText: '水印文字',
    fontSize: 32,
    fontColor: '#ffffff',
    opacity: 50, // 透明度 1-100
    rotation: -30, // 旋转角度
    
    // 输入框显示值（允许为空）
    fontSizeInput: '32',
    opacityInput: '50',
    rotationInput: '-30',
    repeatRowsInput: '3',
    repeatColsInput: '3',
    
    // 水印位置（相对于预览区域的百分比）
    positionX: 50, // 0-100
    positionY: 50, // 0-100
    
    // 重复水印
    repeatMode: false, // 是否开启重复模式
    repeatRows: 3, // 行数
    repeatCols: 3, // 列数
    
    // 预设颜色（6个 + 自定义）
    colors: [
      '#ffffff', '#000000', '#ff4d4f', 
      '#52c41a', '#1890ff', '#faad14'
    ],
    
    // 更多颜色选项
    moreColors: [
      '#000000', // 黑色
      '#333333', // 深灰
      '#666666', // 中灰
      '#999999', // 浅灰
      '#FFFFFF', // 白色
      '#FF0000', // 红色
      '#FF6B6B', // 浅红
      '#FFA500', // 橙色
      '#FFD700', // 金色
      '#FFFF00', // 黄色
      '#00FF00', // 绿色
      '#4CAF50', // 草绿
      '#00CED1', // 青色
      '#1E90FF', // 天蓝
      '#0000FF', // 蓝色
      '#4169E1', // 宝蓝
      '#9370DB', // 紫色
      '#FF1493', // 玫红
      '#8B4513', // 棕色
      '#FF69B4', // 粉红
    ],    
    // 颜色选择器
    showColorPicker: false,
    customColorInput: '',
    
    // 状态
    isProcessing: false,
    
    // 拖动状态
    isDragging: false,
    startX: 0,
    startY: 0,
    
    // 重复水印预览数组
    repeatRowsArray: [0, 1, 2],
    repeatColsArray: [0, 1, 2],
    
    // UI 状态
    showBasicSettings: false, // 基础设置默认折叠
  },

  onLoad() {
    // 获取预览区域尺寸
    const systemInfo = wx.getSystemInfoSync();
    const previewWidth = systemInfo.windowWidth - 48; // 减去padding
    this.setData({
      previewWidth,
      previewHeight: previewWidth, // 正方形预览区
    });
  },

  // ==================== 图片选择 ====================
  
  chooseFromAlbum() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        this.loadImage(res.tempFiles[0].tempFilePath);
      },
    });
  },

  chooseFromChat() {
    wx.chooseMessageFile({
      count: 1,
      type: 'image',
      success: (res) => {
        this.loadImage(res.tempFiles[0].path);
      },
    });
  },

  async loadImage(path) {
    wx.showLoading({ title: '加载中...' });
    
    try {
      const info = await this.getImageInfo(path);
      this.setData({
        imagePath: path,
        imageWidth: info.width,
        imageHeight: info.height,
      });
      wx.hideLoading();
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  getImageInfo(path) {
    return new Promise((resolve, reject) => {
      wx.getImageInfo({
        src: path,
        success: resolve,
        fail: reject,
      });
    });
  },

  // 清除图片
  clearImage() {
    this.setData({
      imagePath: '',
      imageWidth: 0,
      imageHeight: 0,
      positionX: 50,
      positionY: 50,
    });
  },

  // ==================== 水印设置 ====================
  
  onTextInput(e) {
    this.setData({ watermarkText: e.detail.value });
  },

  onFontSizeChange(e) {
    const value = e.detail.value;
    this.setData({ 
      fontSize: value,
      fontSizeInput: String(value),
    });
  },

  onFontSizeInput(e) {
    const inputValue = e.detail.value;
    this.setData({ fontSizeInput: inputValue });
    
    // 空值当作最小值处理
    let value = parseInt(inputValue);
    if (isNaN(value) || inputValue === '') {
      value = 16;
    }
    value = Math.max(16, Math.min(72, value));
    this.setData({ fontSize: value });
  },

  onFontSizeBlur(e) {
    // 失焦时确保显示有效值
    const value = this.data.fontSize;
    this.setData({ fontSizeInput: String(value) });
  },

  onColorSelect(e) {
    const color = e.currentTarget.dataset.color;
    this.setData({ fontColor: color });
  },

  // 打开颜色选择器
  openColorPicker() {
    this.setData({ 
      showColorPicker: true,
      customColorInput: this.data.fontColor,
    });
  },

  // 关闭颜色选择器
  closeColorPicker() {
    this.setData({ showColorPicker: false });
  },

  // 选择更多颜色
  onMoreColorSelect(e) {
    const color = e.currentTarget.dataset.color;
    this.setData({ 
      fontColor: color,
      showColorPicker: false,
    });
  },

  // 输入自定义颜色
  onCustomColorInput(e) {
    let value = e.detail.value;
    // 自动添加 # 号
    if (value && !value.startsWith('#')) {
      value = '#' + value;
    }
    this.setData({ customColorInput: value });
  },

  // 确认自定义颜色
  confirmCustomColor() {
    let color = this.data.customColorInput;
    
    // 验证颜色格式
    if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color)) {
      wx.showToast({ title: '请输入有效的颜色值', icon: 'none' });
      return;
    }
    
    // 转换3位颜色为6位
    if (color.length === 4) {
      color = '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
    }
    
    this.setData({ 
      fontColor: color,
      showColorPicker: false,
    });
  },

  onOpacityChange(e) {
    const value = e.detail.value;
    this.setData({ 
      opacity: value,
      opacityInput: String(value),
    });
  },

  onOpacityInput(e) {
    const inputValue = e.detail.value;
    this.setData({ opacityInput: inputValue });
    
    let value = parseInt(inputValue);
    if (isNaN(value) || inputValue === '') {
      value = 1;
    }
    value = Math.max(1, Math.min(100, value));
    this.setData({ opacity: value });
  },

  onOpacityBlur(e) {
    const value = this.data.opacity;
    this.setData({ opacityInput: String(value) });
  },

  onRotationChange(e) {
    const value = e.detail.value;
    this.setData({ 
      rotation: value,
      rotationInput: String(value),
    });
  },

  onRotationInput(e) {
    const inputValue = e.detail.value;
    this.setData({ rotationInput: inputValue });
    
    // 允许输入负号
    if (inputValue === '-' || inputValue === '') {
      this.setData({ rotation: 0 });
      return;
    }
    
    let value = parseInt(inputValue);
    if (isNaN(value)) {
      value = 0;
    }
    value = Math.max(-90, Math.min(90, value));
    this.setData({ rotation: value });
  },

  onRotationBlur(e) {
    const value = this.data.rotation;
    this.setData({ rotationInput: String(value) });
  },

  // 切换基础设置展开/折叠
  toggleBasicSettings() {
    this.setData({ showBasicSettings: !this.data.showBasicSettings });
  },

  // ==================== 重复模式 ====================
  
  toggleRepeatMode() {
    const newMode = !this.data.repeatMode;
    this.setData({ 
      repeatMode: newMode,
    });
    
    // 开启时更新预览数组
    if (newMode) {
      this.updateRepeatArrays();
    }
  },

  onRepeatRowsChange(e) {
    const value = e.detail.value;
    this.setData({ 
      repeatRows: value,
      repeatRowsInput: String(value),
    });
    this.updateRepeatArrays();
  },

  onRepeatRowsInput(e) {
    const inputValue = e.detail.value;
    this.setData({ repeatRowsInput: inputValue });
    
    let value = parseInt(inputValue);
    if (isNaN(value) || inputValue === '') {
      value = 1;
    }
    value = Math.max(1, Math.min(10, value));
    this.setData({ repeatRows: value });
    this.updateRepeatArrays();
  },

  onRepeatRowsBlur(e) {
    const value = this.data.repeatRows;
    this.setData({ repeatRowsInput: String(value) });
  },

  onRepeatColsChange(e) {
    const value = e.detail.value;
    this.setData({ 
      repeatCols: value,
      repeatColsInput: String(value),
    });
    this.updateRepeatArrays();
  },

  onRepeatColsInput(e) {
    const inputValue = e.detail.value;
    this.setData({ repeatColsInput: inputValue });
    
    let value = parseInt(inputValue);
    if (isNaN(value) || inputValue === '') {
      value = 1;
    }
    value = Math.max(1, Math.min(10, value));
    this.setData({ repeatCols: value });
    this.updateRepeatArrays();
  },

  onRepeatColsBlur(e) {
    const value = this.data.repeatCols;
    this.setData({ repeatColsInput: String(value) });
  },

  // 更新重复水印的预览数组
  updateRepeatArrays() {
    const { repeatRows, repeatCols } = this.data;
    const repeatRowsArray = Array.from({ length: repeatRows }, (_, i) => i);
    const repeatColsArray = Array.from({ length: repeatCols }, (_, i) => i);
    this.setData({ repeatRowsArray, repeatColsArray });
  },

  // ==================== 拖动定位 ====================
  
  onTouchStart(e) {
    if (this.data.repeatMode) return; // 重复模式下不支持拖动
    
    const touch = e.touches[0];
    this.setData({
      isDragging: true,
      startX: touch.clientX,
      startY: touch.clientY,
    });
  },

  onTouchMove(e) {
    if (!this.data.isDragging || this.data.repeatMode) return;
    
    const touch = e.touches[0];
    const { startX, startY, positionX, positionY, previewWidth, previewHeight } = this.data;
    
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    
    // 转换为百分比
    const deltaPercentX = (deltaX / previewWidth) * 100;
    const deltaPercentY = (deltaY / previewHeight) * 100;
    
    let newX = positionX + deltaPercentX;
    let newY = positionY + deltaPercentY;
    
    // 限制范围
    newX = Math.max(0, Math.min(100, newX));
    newY = Math.max(0, Math.min(100, newY));
    
    this.setData({
      positionX: newX,
      positionY: newY,
      startX: touch.clientX,
      startY: touch.clientY,
    });
  },

  onTouchEnd() {
    this.setData({ isDragging: false });
  },

  // ==================== 预览大图 ====================
  
  async previewImage() {
    if (!this.data.imagePath) return;
    
    // 如果没有水印文字，预览原图
    if (!this.data.watermarkText) {
      wx.previewImage({
        urls: [this.data.imagePath],
        current: this.data.imagePath,
      });
      return;
    }
    
    // 生成水印图片再预览
    wx.showLoading({ title: '生成预览...' });
    
    try {
      const result = await this.drawWatermark();
      wx.hideLoading();
      
      wx.previewImage({
        urls: [result],
        current: result,
      });
    } catch (error) {
      wx.hideLoading();
      // 生成失败则预览原图
      wx.previewImage({
        urls: [this.data.imagePath],
        current: this.data.imagePath,
      });
    }
  },

  // ==================== 生成水印 ====================

  drawWatermark() {
    return new Promise((resolve, reject) => {
      const query = wx.createSelectorQuery();
      query.select('#watermarkCanvas')
        .fields({ node: true, size: true })
        .exec(async (res) => {
          if (!res[0]) {
            reject(new Error('Canvas not found'));
            return;
          }

          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const { 
            imagePath, imageWidth, imageHeight,
            watermarkText, fontSize, fontColor, opacity, rotation,
            positionX, positionY,
            repeatMode, repeatRows, repeatCols
          } = this.data;

          // 设置画布尺寸
          canvas.width = imageWidth;
          canvas.height = imageHeight;

          // 加载并绘制原图
          const img = canvas.createImage();
          img.src = imagePath;
          
          await new Promise((resolveImg) => {
            img.onload = () => {
              ctx.drawImage(img, 0, 0, imageWidth, imageHeight);
              resolveImg();
            };
            img.onerror = () => reject(new Error('Image load failed'));
          });

          // 设置水印样式
          const actualFontSize = fontSize * 2; // 适配高分辨率
          ctx.font = `bold ${actualFontSize}px sans-serif`;
          ctx.fillStyle = this.hexToRgba(fontColor, opacity / 100);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          if (repeatMode) {
            // 重复水印模式
            const cellWidth = imageWidth / repeatCols;
            const cellHeight = imageHeight / repeatRows;
            
            for (let row = 0; row < repeatRows; row++) {
              for (let col = 0; col < repeatCols; col++) {
                const x = cellWidth * (col + 0.5);
                const y = cellHeight * (row + 0.5);
                
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate((rotation * Math.PI) / 180);
                ctx.fillText(watermarkText, 0, 0);
                ctx.restore();
              }
            }
          } else {
            // 单个水印模式
            const x = (positionX / 100) * imageWidth;
            const y = (positionY / 100) * imageHeight;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.fillText(watermarkText, 0, 0);
            ctx.restore();
          }

          // 导出图片
          setTimeout(() => {
            wx.canvasToTempFilePath({
              canvas,
              success: (res) => resolve(res.tempFilePath),
              fail: reject,
            });
          }, 100);
        });
    });
  },

  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },

  // ==================== 保存分享 ====================
  
  async saveImage() {
    if (!this.data.imagePath) {
      wx.showToast({ title: '请先选择图片', icon: 'none' });
      return;
    }
    if (!this.data.watermarkText) {
      wx.showToast({ title: '请输入水印文字', icon: 'none' });
      return;
    }

    this.setData({ isProcessing: true });
    wx.showLoading({ title: '生成中...' });

    try {
      const result = await this.drawWatermark();
      
      wx.saveImageToPhotosAlbum({
        filePath: result,
        success: () => {
          wx.hideLoading();
          this.setData({ isProcessing: false });
          wx.showToast({ title: '保存成功', icon: 'success' });
        },
        fail: (err) => {
          wx.hideLoading();
          this.setData({ isProcessing: false });
          if (err.errMsg.includes('auth deny')) {
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
            wx.showToast({ title: '保存失败', icon: 'none' });
          }
        },
      });
    } catch (error) {
      wx.hideLoading();
      this.setData({ isProcessing: false });
      wx.showToast({ title: '生成失败', icon: 'none' });
      console.error('生成失败', error);
    }
  },

  async shareImage() {
    if (!this.data.imagePath) {
      wx.showToast({ title: '请先选择图片', icon: 'none' });
      return;
    }
    if (!this.data.watermarkText) {
      wx.showToast({ title: '请输入水印文字', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '生成中...' });

    try {
      const result = await this.drawWatermark();
      wx.hideLoading();
      
      wx.showShareImageMenu({
        path: result,
        fail: () => {
          wx.showToast({ title: '分享失败', icon: 'none' });
        },
      });
    } catch (error) {
      wx.hideLoading();
      wx.showToast({ title: '生成失败', icon: 'none' });
    }
  },
});
