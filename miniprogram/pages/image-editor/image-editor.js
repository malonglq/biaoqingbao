// image-editor.js
const { showToast } = require('../../utils/common.js');
const SimpleFilterManager = require('../../utils/simpleFilterManager.js');

Page({
  data: {
    // 图片信息
    imageSrc: '',
    originalImageSrc: '',
    imageWidth: 0,
    imageHeight: 0,

    // Canvas尺寸
    canvasWidth: 300,
    canvasHeight: 300,

    // 安全区域
    safeAreaHeight: 0,

    // 当前工具和滤镜
    currentTool: '',
    currentFilter: '',

    // 统一参数控制
    showParamControl: false,
    showConfirmButton: false,
    paramLabel: '',
    paramValue: 0,
    paramMin: 0,
    paramMax: 100,
    paramUnit: '%',

    // 工具配置
    toolConfig: {
      brushSize: 20,
      brushColor: '#FF6B6B'
    },

    // 颜色选项
    colorOptions: [
      '#FF6B6B', '#FFE66D', '#9C88FF', '#48BB78',
      '#4299E1', '#ED8936', '#F56565', '#000000',
      '#FFFFFF', '#718096'
    ],

    // 历史记录状态
    canUndo: false,
    canRedo: false,

    // 编辑状态
    isEditing: false,
    hasChanges: false
  },

  // 滤镜管理器
  filterManager: null,

  // 防抖定时器
  paramDebounceTimer: null,

  onLoad(options) {
    // 获取传入的图片信息
    const { imageSrc, imageType = 'body', imageId } = options;

    if (!imageSrc) {
      showToast('图片信息错误', 'error');
      wx.navigateBack();
      return;
    }

    // 初始化简化版滤镜管理器（添加错误处理）
    try {
      this.filterManager = new SimpleFilterManager();
      console.log('简化版滤镜管理器初始化成功');
    } catch (error) {
      console.error('滤镜管理器初始化失败:', error);
      this.filterManager = null;
      // 不阻止页面加载，只是禁用滤镜功能
    }

    // 设置页面数据
    this.setData({
      imageSrc: decodeURIComponent(imageSrc),
      originalImageSrc: decodeURIComponent(imageSrc),
      imageType,
      imageId
    });

    // 获取安全区域信息
    this.getSafeAreaInfo();

    // 计算Canvas尺寸
    this.calculateCanvasSize();
  },

  onReady() {
    // 页面渲染完成，获取Canvas编辑器组件实例
    this.canvasEditor = this.selectComponent('#canvasEditor');

    // 重新计算Canvas尺寸，确保准确
    setTimeout(() => {
      this.calculateCanvasSize();
    }, 100);
  },

  onUnload() {
    // 页面卸载时清理资源
    if (this.canvasEditor) {
      this.canvasEditor.cleanup();
    }

    // 清理滤镜管理器
    if (this.filterManager) {
      this.filterManager.cleanup();
    }

    // 清理定时器
    if (this.paramDebounceTimer) {
      clearTimeout(this.paramDebounceTimer);
    }
  },

  // 获取安全区域信息
  getSafeAreaInfo() {
    const systemInfo = wx.getSystemInfoSync();
    const safeAreaHeight = systemInfo.safeArea ? systemInfo.safeArea.top : systemInfo.statusBarHeight || 0;
    
    this.setData({
      safeAreaHeight: safeAreaHeight * 2 // 转换为rpx
    });
  },

  // 计算Canvas尺寸
  calculateCanvasSize() {
    const query = wx.createSelectorQuery().in(this);
    query.select('.preview-area').boundingClientRect((rect) => {
      console.log('预览区域尺寸:', rect);
      if (rect && rect.width > 0 && rect.height > 0) {
        const padding = 40; // 内边距
        const canvasWidth = rect.width - padding;
        const canvasHeight = rect.height - padding;

        console.log('计算的Canvas尺寸:', { canvasWidth, canvasHeight });

        this.setData({
          canvasWidth: Math.floor(canvasWidth),
          canvasHeight: Math.floor(canvasHeight)
        });
      } else {
        // 如果获取不到尺寸，使用默认值
        console.log('使用默认Canvas尺寸');
        this.setData({
          canvasWidth: 300,
          canvasHeight: 300
        });
      }
    }).exec();
  },

  // Canvas准备就绪
  onCanvasReady(e) {
    this.setData({ canvasReady: true });
  },

  // Canvas初始化失败
  onCanvasInitFailed(e) {
    console.log('Canvas初始化失败:', e.detail);
    this.setData({ canvasReady: false });

    // 显示提示信息
    wx.showToast({
      title: '滤镜功能不可用',
      icon: 'none',
      duration: 2000
    });
  },

  // 图片加载完成
  onImageLoaded(e) {
    const { width, height } = e.detail;
    this.setData({
      imageWidth: width,
      imageHeight: height
    });
  },

  // Canvas图像数据准备就绪
  onImageDataReady(e) {
    const { imageData } = e.detail;
    if (this.filterManager && imageData) {
      try {
        // 初始化滤镜管理器的原始图像数据
        const success = this.filterManager.setOriginalImageData(imageData);
        if (success) {
          console.log('滤镜管理器图像数据已初始化');

          // 添加调试信息
          console.log('图像数据详情:', {
            width: imageData.width,
            height: imageData.height,
            dataLength: imageData.data.length,
            firstPixel: {
              r: imageData.data[0],
              g: imageData.data[1],
              b: imageData.data[2],
              a: imageData.data[3]
            }
          });
        } else {
          console.warn('滤镜管理器图像数据初始化失败');
        }
      } catch (error) {
        console.error('滤镜管理器图像数据初始化异常:', error);
      }
    } else {
      console.warn('滤镜管理器不可用或图像数据无效');
    }
  },

  // 操作完成
  onOperationComplete(e) {
    const { canUndo, canRedo, hasChanges } = e.detail;
    this.setData({
      canUndo,
      canRedo,
      hasChanges
    });
  },

  // 选择滤镜
  selectFilter(e) {
    const { filter } = e.currentTarget.dataset;

    // 检查滤镜管理器是否可用
    if (!this.filterManager) {
      showToast('滤镜功能不可用', 'error');
      return;
    }

    // 清除当前工具选择
    this.setData({
      currentTool: '',
      currentFilter: filter
    });

    try {
      // 激活滤镜
      const success = this.filterManager.activateFilter(filter);

      if (success) {
        // 设置参数控制界面
        this.setupFilterParams(filter);

        // 显示参数控制和确认按钮
        this.setData({
          showParamControl: true,
          showConfirmButton: true
        });

        console.log(`${filter}滤镜已激活，界面已更新`);
      } else {
        showToast('滤镜激活失败', 'error');
      }
    } catch (error) {
      console.error('选择滤镜失败:', error);
      showToast('滤镜功能异常', 'error');
    }
  },

  // 选择工具
  selectTool(e) {
    const { tool } = e.currentTarget.dataset;

    // 清除当前滤镜选择
    this.setData({
      currentFilter: '',
      currentTool: tool,
      showParamControl: false,
      showConfirmButton: false
    });

    // 取消激活滤镜
    if (this.filterManager) {
      this.filterManager.deactivateFilter();
    }

    // 设置工具参数
    this.setupToolParams(tool);

    // 通知Canvas编辑器切换工具
    if (this.canvasEditor) {
      this.canvasEditor.setTool(tool, this.data.toolConfig);
    }

    console.log(`工具已切换到: ${tool}`);
  },

  // 设置滤镜参数界面
  setupFilterParams(filterName) {
    switch (filterName) {
      case 'grayscale':
        this.setData({
          paramLabel: '黑白强度',
          paramValue: 100,
          paramMin: 0,
          paramMax: 100,
          paramUnit: '%'
        });
        break;
      case 'opacity':
        this.setData({
          paramLabel: '透明度',
          paramValue: 100,
          paramMin: 0,
          paramMax: 100,
          paramUnit: '%'
        });
        break;
      default:
        this.setData({
          showParamControl: false,
          showConfirmButton: false
        });
    }
  },

  // 设置工具参数界面
  setupToolParams(toolName) {
    switch (toolName) {
      case 'brush':
      case 'eraser':
        this.setData({
          paramLabel: '大小',
          paramValue: this.data.toolConfig.brushSize,
          paramMin: 5,
          paramMax: 50,
          paramUnit: 'px',
          showParamControl: true,
          showConfirmButton: false
        });
        break;
      default:
        this.setData({
          showParamControl: false,
          showConfirmButton: false
        });
    }
  },

  // 统一参数变化处理（拖动结束时触发）
  onParamChange(e) {
    const value = e.detail.value;
    this.setData({
      paramValue: value
    });

    // 清除防抖定时器
    if (this.paramDebounceTimer) {
      clearTimeout(this.paramDebounceTimer);
      this.paramDebounceTimer = null;
    }

    // 根据当前激活的功能处理参数变化
    this.handleParamChange(value, false);
  },

  // 统一参数实时变化处理（拖动过程中触发）
  onParamChanging(e) {
    const value = e.detail.value;
    console.log('🎚️ onParamChanging 触发:', { value });

    this.setData({
      paramValue: value
    });

    // 清除之前的防抖定时器
    if (this.paramDebounceTimer) {
      clearTimeout(this.paramDebounceTimer);
    }

    // 使用防抖处理实时参数调节
    this.paramDebounceTimer = setTimeout(() => {
      console.log('⏰ 防抖定时器触发，开始处理参数变化');
      this.handleParamChange(value, true);
    }, 50); // 50ms防抖延迟
  },

  // 处理参数变化
  handleParamChange(value, isRealtime) {
    const { currentFilter, currentTool } = this.data;

    if (currentFilter) {
      // 滤镜参数处理
      this.handleFilterParamChange(currentFilter, value, isRealtime);
    } else if (currentTool) {
      // 工具参数处理
      this.handleToolParamChange(currentTool, value);
    }
  },

  // 处理滤镜参数变化
  handleFilterParamChange(filterName, value, isRealtime) {
    console.log('🎛️ handleFilterParamChange 开始:', {
      filterName,
      value,
      isRealtime,
      hasFilterManager: !!this.filterManager,
      hasCanvasEditor: !!this.canvasEditor
    });

    if (!this.filterManager || !this.canvasEditor) {
      console.error('❌ 滤镜管理器或Canvas编辑器不可用');
      return;
    }

    try {
      // 设置滤镜强度
      console.log('📊 设置滤镜强度:', value);
      this.filterManager.setFilterIntensity(value);

      if (isRealtime) {
        // 实时预览模式
        console.log('🔄 开始实时预览模式');
        const previewData = this.filterManager.previewFilter(value);

        console.log('📋 预览数据结果:', {
          hasPreviewData: !!previewData,
          previewDataSize: previewData ? `${previewData.width}x${previewData.height}` : 'null'
        });

        if (previewData && this.canvasEditor.updateImageData) {
          console.log('🖼️ 开始更新Canvas图像数据');
          this.canvasEditor.updateImageData(previewData);
          console.log(`✅ 实时预览${filterName}滤镜完成，强度: ${value}%`);
        } else {
          console.warn('⚠️ 预览数据无效或updateImageData方法不可用');
        }
      } else {
        // 退出预览模式
        console.log('🚪 退出预览模式');
        this.filterManager.exitPreviewMode();
      }
    } catch (error) {
      console.error('❌ 处理滤镜参数变化失败:', error);
    }
  },

  // 处理工具参数变化
  handleToolParamChange(toolName, value) {
    switch (toolName) {
      case 'brush':
      case 'eraser':
        this.setData({
          'toolConfig.brushSize': value
        });

        // 更新笔刷配置
        if (this.canvasEditor) {
          this.canvasEditor.setBrushSize(value);
        }
        break;
    }
  },

  // 应用当前效果
  applyCurrentEffect() {
    const { currentFilter } = this.data;

    if (currentFilter && this.filterManager) {
      try {
        const intensity = this.filterManager.getFilterIntensity();

        // 应用滤镜效果
        const resultData = this.filterManager.applyCurrentFilter(intensity);

        if (resultData && this.canvasEditor && this.canvasEditor.updateImageData) {
          // 更新Canvas显示
          this.canvasEditor.updateImageData(resultData);

          // 更新滤镜管理器的原始图像数据（用于后续操作）
          this.filterManager.setOriginalImageData(resultData);

          // 保存到历史记录
          if (this.canvasEditor.saveToHistory) {
            this.canvasEditor.saveToHistory();
          }

          // 更新状态
          this.setData({
            currentFilter: '',
            showParamControl: false,
            showConfirmButton: false,
            hasChanges: true
          });

          // 清理滤镜状态
          this.filterManager.deactivateFilter();

          showToast(`${currentFilter === 'grayscale' ? '黑白' : '透明化'}效果已应用`, 'success');
          console.log(`${currentFilter}滤镜效果已应用，强度: ${intensity}%`);
        } else {
          showToast('应用效果失败', 'error');
          console.error('应用效果失败: resultData或updateImageData不可用');
        }
      } catch (error) {
        console.error('应用效果失败:', error);
        showToast('应用效果异常', 'error');
      }
    } else {
      showToast('没有激活的滤镜', 'error');
    }
  },

  // 选择笔刷颜色
  selectBrushColor(e) {
    const { color } = e.currentTarget.dataset;
    this.setData({
      'toolConfig.brushColor': color
    });
    
    // 更新笔刷颜色
    if (this.canvasEditor) {
      this.canvasEditor.setBrushColor(color);
    }
  },

  // 撤销操作
  undo() {
    if (!this.data.canUndo || !this.canvasEditor) return;
    this.canvasEditor.undo();
  },

  // 重做操作
  redo() {
    if (!this.data.canRedo || !this.canvasEditor) return;
    this.canvasEditor.redo();
  },

  // 重置图片
  reset() {
    wx.showModal({
      title: '确认重置',
      content: '重置后将清除所有编辑内容，是否继续？',
      success: (res) => {
        if (res.confirm && this.canvasEditor) {
          this.canvasEditor.reset();
          this.setData({
            currentTool: '',
            showToolParams: false,
            hasChanges: false
          });
        }
      }
    });
  },

  // 取消编辑
  cancel() {
    if (this.data.hasChanges) {
      wx.showModal({
        title: '确认取消',
        content: '当前有未保存的编辑内容，是否确认取消？',
        success: (res) => {
          if (res.confirm) {
            wx.navigateBack();
          }
        }
      });
    } else {
      wx.navigateBack();
    }
  },

  // 保存编辑
  save() {
    showToast('正在保存...', 'loading');

    // 如果Canvas编辑器可用，尝试导出编辑后的图片
    if (this.canvasEditor && this.canvasEditor.exportImage) {
      this.canvasEditor.exportImage()
        .then((tempFilePath) => {
          this.saveResult(tempFilePath);
        })
        .catch((error) => {
          console.error('图片导出失败，使用原图:', error);
          // 如果导出失败，使用原图
          this.saveResult(this.data.imageSrc);
        });
    } else {
      // 如果Canvas编辑器不可用，直接使用原图
      this.saveResult(this.data.imageSrc);
    }
  },

  // 保存结果
  saveResult(imagePath) {
    // 返回上一页并传递编辑结果
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];

    if (prevPage && prevPage.updateEditedImage) {
      prevPage.updateEditedImage({
        imageId: this.data.imageId,
        imageType: this.data.imageType,
        newImageSrc: imagePath,
        originalImageSrc: this.data.originalImageSrc
      });
    }

    showToast('保存成功', 'success');
    wx.navigateBack();
  }
});
