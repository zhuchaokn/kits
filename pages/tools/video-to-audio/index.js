Page({
  /**
   * 分享给朋友
   */
  onShareAppMessage() {
    return {
      title: '🎵 视频提取音频，微信聊天视频也能提！',
      path: '/pages/tools/video-to-audio/index',
      imageUrl: '/static/share/video-audio.png',
    };
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline() {
    return {
      title: '视频提取音频 | 支持微信聊天视频，一键提取背景音乐',
      query: '',
      imageUrl: '/static/share/video-audio.png',
    };
  },

  data: {
    // 视频
    videoPath: '',
    duration: 0,
    durationText: '00:00',
    fileSize: '',
    
    // 音频
    audioPath: '',
    savedAudioPath: '', // 保存后的路径
    
    // 播放状态
    isPlaying: false,
    currentTime: 0,
    currentTimeText: '00:00',
    playProgress: 0,
    audioDuration: 0, // 音频实际时长
    
    // 提取状态
    extractStatus: 'idle', // idle | extracting | success | error
    errorMsg: '',
  },

  audioContext: null,

  onLoad() {
    // 设置音频会话类别，让音频在静音模式下也能播放
    wx.setInnerAudioOption({
      obeyMuteSwitch: false,
      mixWithOther: false,
      success: () => {
        console.log('设置音频选项成功');
      },
      fail: (err) => {
        console.error('设置音频选项失败', err);
      }
    });
    
    // 创建音频上下文
    this.audioContext = wx.createInnerAudioContext({
      obeyMuteSwitch: false, // 不遵循系统静音开关
    });
    // 设置音量
    this.audioContext.volume = 1;
    
    this.audioContext.onCanplay(() => {
      console.log('音频可以播放了，时长:', this.audioContext.duration);
      if (this.audioContext.duration) {
        this.setData({ 
          audioDuration: this.audioContext.duration,
        });
      }
    });
    this.audioContext.onPlay(() => {
      console.log('开始播放');
      this.setData({ isPlaying: true });
    });
    this.audioContext.onPause(() => {
      console.log('暂停播放');
      this.setData({ isPlaying: false });
    });
    this.audioContext.onStop(() => {
      this.setData({ isPlaying: false, currentTime: 0, playProgress: 0, currentTimeText: '00:00' });
    });
    this.audioContext.onEnded(() => {
      console.log('播放结束');
      this.setData({ isPlaying: false, currentTime: 0, playProgress: 0, currentTimeText: '00:00' });
    });
    this.audioContext.onTimeUpdate(() => {
      const currentTime = this.audioContext.currentTime || 0;
      const duration = this.data.audioDuration || this.audioContext.duration || this.data.duration || 1;
      this.setData({
        currentTime,
        currentTimeText: this.formatTime(currentTime),
        playProgress: (currentTime / duration) * 100,
      });
    });
    this.audioContext.onError((err) => {
      console.error('音频播放错误', err);
      wx.showToast({ title: '播放失败', icon: 'none' });
      this.setData({ isPlaying: false });
    });
  },

  onUnload() {
    if (this.audioContext) {
      this.audioContext.destroy();
    }
  },

  // ==================== 视频选择 ====================
  
  chooseFromAlbum() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['video'],
      sourceType: ['album'],
      success: (res) => {
        this.loadVideo(res.tempFiles[0]);
      },
    });
  },

  chooseFromChat() {
    // 先提示用户
    wx.showModal({
      title: '提示',
      content: '从聊天记录选择视频可能需要等待加载。如果加载太慢，建议先将视频保存到相册，再使用"从相册选择"',
      confirmText: '继续选择',
      cancelText: '取消',
      success: (modalRes) => {
        if (modalRes.confirm) {
          this.doChooseFromChat();
        }
      }
    });
  },

  doChooseFromChat() {
    wx.chooseMessageFile({
      count: 1,
      type: 'video',
      success: (res) => {
        this.loadVideo(res.tempFiles[0]);
      },
      fail: (err) => {
        console.error('选择文件失败', err);
        if (!err.errMsg.includes('cancel')) {
          wx.showToast({ title: '选择失败，请重试', icon: 'none' });
        }
      }
    });
  },

  loadVideo(file) {
    wx.showLoading({ title: '加载中...' });
    
    const videoPath = file.tempFilePath || file.path;
    const size = file.size;
    
    // 验证文件是否真的存在且可用
    const fs = wx.getFileSystemManager();
    fs.access({
      path: videoPath,
      success: () => {
        // 文件存在，继续加载
        this.doLoadVideo(videoPath, size);
      },
      fail: () => {
        wx.hideLoading();
        wx.showModal({
          title: '文件不可用',
          content: '文件可能还在下载中，请稍后重试，或者先在微信中播放一次该视频再选择',
          showCancel: false,
        });
      },
    });
  },

  doLoadVideo(videoPath, size) {
    this.setData({
      videoPath,
      fileSize: this.formatFileSize(size),
      audioPath: '',
      savedAudioPath: '',
      extractStatus: 'idle',
      errorMsg: '',
      isPlaying: false,
      currentTime: 0,
      playProgress: 0,
    });
    
    wx.hideLoading();
  },

  onVideoLoaded(e) {
    const duration = e.detail.duration;
    this.setData({
      duration,
      durationText: this.formatTime(duration),
    });
  },

  onVideoError(e) {
    console.error('视频加载错误', e);
    wx.showToast({ title: '视频加载失败', icon: 'none' });
  },

  clearVideo() {
    if (this.audioContext) {
      this.audioContext.stop();
    }
    this.setData({
      videoPath: '',
      duration: 0,
      durationText: '00:00',
      fileSize: '',
      audioPath: '',
      savedAudioPath: '',
      extractStatus: 'idle',
      errorMsg: '',
      isPlaying: false,
      currentTime: 0,
      playProgress: 0,
      audioDuration: 0,
    });
  },

  // ==================== 音频提取 ====================
  
  extractAudio() {
    if (!this.data.videoPath) {
      wx.showToast({ title: '请先选择视频', icon: 'none' });
      return;
    }

    this.setData({ extractStatus: 'extracting', errorMsg: '' });

    const that = this;
    
    // 使用 MediaContainer 提取音频
    const mediaContainer = wx.createMediaContainer();
    
    // 设置超时处理
    const timeout = setTimeout(() => {
      console.error('提取音频超时');
      that.setData({ 
        extractStatus: 'error', 
        errorMsg: '提取超时，请尝试较短的视频' 
      });
      try {
        mediaContainer.destroy();
      } catch (e) {}
    }, 60000); // 60秒超时
    
    mediaContainer.extractDataSource({
      source: this.data.videoPath,
      success: (res) => {
        console.log('extractDataSource 成功', res);
        console.log('tracks 详情:', JSON.stringify(res.tracks));
        
        try {
          const tracks = res.tracks || [];
          
          if (tracks.length === 0) {
            clearTimeout(timeout);
            that.setData({ 
              extractStatus: 'error', 
              errorMsg: '无法提取视频轨道' 
            });
            mediaContainer.destroy();
            return;
          }
          
          // 打印每个轨道的信息
          tracks.forEach((track, index) => {
            console.log(`轨道 ${index}:`, track, '类型:', track.kind);
          });
          
          // 根据 kind 属性区分音频和视频轨道
          // kind: 'audio' 或 'video'
          const audioTracks = tracks.filter(track => track.kind === 'audio');
          const videoTracks = tracks.filter(track => track.kind === 'video');
          
          console.log('音频轨道数量:', audioTracks.length);
          console.log('视频轨道数量:', videoTracks.length);
          
          if (audioTracks.length === 0) {
            clearTimeout(timeout);
            that.setData({ 
              extractStatus: 'error', 
              errorMsg: '视频中没有音频轨道' 
            });
            mediaContainer.destroy();
            return;
          }

          // 只添加音频轨道到容器
          audioTracks.forEach(track => {
            mediaContainer.addTrack(track);
          });

          // 导出音频
          mediaContainer.export({
            success: (exportRes) => {
              clearTimeout(timeout);
              console.log('导出成功:', exportRes.tempFilePath);
              
              that.setData({
                audioPath: exportRes.tempFilePath,
                extractStatus: 'success',
              });
              
              // 设置音频源
              if (that.audioContext) {
                that.audioContext.src = exportRes.tempFilePath;
              }
              
              mediaContainer.destroy();
            },
            fail: (err) => {
              clearTimeout(timeout);
              console.error('导出音频失败', err);
              that.setData({ 
                extractStatus: 'error', 
                errorMsg: '导出音频失败: ' + (err.errMsg || '未知错误')
              });
              mediaContainer.destroy();
            },
          });
        } catch (e) {
          clearTimeout(timeout);
          console.error('处理轨道时出错', e);
          that.setData({ 
            extractStatus: 'error', 
            errorMsg: '处理失败: ' + e.message
          });
          mediaContainer.destroy();
        }
      },
      fail: (err) => {
        clearTimeout(timeout);
        console.error('提取数据源失败', err);
        that.setData({ 
          extractStatus: 'error', 
          errorMsg: '无法读取视频: ' + (err.errMsg || '未知错误')
        });
        mediaContainer.destroy();
      },
    });
  },

  // ==================== 音频播放 ====================
  
  togglePlay() {
    if (!this.audioContext) {
      console.error('audioContext 不存在');
      return;
    }
    
    const audioPath = this.data.savedAudioPath || this.data.audioPath;
    if (!audioPath) {
      console.error('没有音频路径');
      return;
    }
    
    // 确保音频源已设置
    if (this.audioContext.src !== audioPath) {
      console.log('设置音频源:', audioPath);
      this.audioContext.src = audioPath;
    }
    
    if (this.data.isPlaying) {
      this.audioContext.pause();
    } else {
      console.log('尝试播放:', audioPath);
      this.audioContext.play();
    }
  },

  // ==================== 保存分享 ====================
  
  saveAudio() {
    const audioPath = this.data.savedAudioPath || this.data.audioPath;
    if (!audioPath) {
      wx.showToast({ title: '请先提取音频', icon: 'none' });
      return;
    }

    // 如果已经保存过，直接提示
    if (this.data.savedAudioPath) {
      wx.showModal({
        title: '已保存',
        content: '音频已保存，您可以点击"分享"发送给好友',
        showCancel: false,
        confirmText: '知道了',
      });
      return;
    }

    wx.showLoading({ title: '保存中...' });

    const that = this;
    // 使用 copyFile 而不是 saveFile，这样不会移动原文件
    const fs = wx.getFileSystemManager();
    const timestamp = Date.now();
    const fileName = `audio_${timestamp}.m4a`; // 使用 m4a 格式，兼容性更好
    const savedPath = `${wx.env.USER_DATA_PATH}/${fileName}`;
    
    fs.copyFile({
      srcPath: this.data.audioPath,
      destPath: savedPath,
      success: () => {
        wx.hideLoading();
        
        // 更新保存后的路径
        that.setData({ savedAudioPath: savedPath });
        
        // 更新音频播放源
        if (that.audioContext) {
          that.audioContext.src = savedPath;
        }
        
        wx.showModal({
          title: '保存成功',
          content: '音频已保存，您可以点击"分享"发送给好友',
          showCancel: false,
          confirmText: '知道了',
        });
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('保存失败', err);
        wx.showToast({ title: '保存失败: ' + (err.errMsg || ''), icon: 'none' });
      },
    });
  },

  shareAudio() {
    const audioPath = this.data.savedAudioPath || this.data.audioPath;
    if (!audioPath) {
      wx.showToast({ title: '请先提取音频', icon: 'none' });
      return;
    }

    // 如果还没保存，先保存再分享
    if (!this.data.savedAudioPath) {
      wx.showLoading({ title: '准备中...' });
      
      const that = this;
      const fs = wx.getFileSystemManager();
      const timestamp = Date.now();
      const fileName = `audio_${timestamp}.m4a`;
      const savedPath = `${wx.env.USER_DATA_PATH}/${fileName}`;
      
      fs.copyFile({
        srcPath: this.data.audioPath,
        destPath: savedPath,
        success: () => {
          wx.hideLoading();
          that.setData({ savedAudioPath: savedPath });
          
          // 更新音频播放源
          if (that.audioContext) {
            that.audioContext.src = savedPath;
          }
          
          // 然后分享
          that.doShare(savedPath);
        },
        fail: (err) => {
          wx.hideLoading();
          console.error('准备分享失败', err);
          wx.showToast({ title: '分享失败', icon: 'none' });
        },
      });
    } else {
      this.doShare(this.data.savedAudioPath);
    }
  },

  doShare(filePath) {
    wx.shareFileMessage({
      filePath: filePath,
      fileName: `提取的音频_${Date.now()}.m4a`,
      success: () => {
        wx.showToast({ title: '分享成功', icon: 'success' });
      },
      fail: (err) => {
        console.error('分享失败', err);
        if (err.errMsg && err.errMsg.includes('cancel')) {
          return;
        }
        wx.showToast({ title: '分享失败', icon: 'none' });
      },
    });
  },

  // ==================== 工具函数 ====================
  
  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  formatFileSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  },
});

