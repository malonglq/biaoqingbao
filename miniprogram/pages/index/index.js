// index.js
const { getMaterials, getBodyCategories, getExpressionCategories } = require('../../utils/materials.js');
const { applyTransform, constrainToBounds, getDistance, getAngle, radianToDegree, getAngleDifference, getTouchCenter, constrainScale, normalizeRotation, createDefaultTransform, cloneTransform } = require('../../utils/transform.js');
const { calculateColorFromPercentage, generateTextStroke, debounce, showToast } = require('../../utils/common.js');
const { uploadImages, BODY_UPLOAD_CONFIG, EXPRESSION_UPLOAD_CONFIG } = require('../../utils/imageUpload.js');

Page({
  data: {
    // 当前标签页
    currentTab: 'body',

    // 安全区域信息
    safeAreaInsets: {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    },

    // 安全区域高度（rpx单位）
    safeAreaHeight: 0,
    
    // 分类相关
    bodyCurrentCategory: 'panda',
    expressionCurrentCategory: 'happy',
    bodyCategories: [],
    expressionCategories: [],
    
    // 素材相关
    bodyMaterials: [],
    expressionMaterials: [],
    selectedBody: null,
    selectedExpression: null,

    // 素材类型标识
    selectedBodyIsImage: false,
    selectedExpressionIsImage: false,

    // 自定义上传图片
    customBodyImages: [],
    customExpressionImages: [],
    
    // 文字相关
    textContent: '',
    textColor: '#000000',
    strokeEnabled: true,
    strokeColor: '#ffffff',
    textColorPosition: 0,
    strokeColorPosition: 100,
    textShadow: '',
    
    // 图层变换
    layerTransforms: {
      body: createDefaultTransform(),
      expression: createDefaultTransform(),
      text: createDefaultTransform()
    },
    bodyTransform: '',
    expressionTransform: '',
    textTransform: '',
    
    // 生成选项
    generateSize: 'small',
    generateQuality: 'suitable',
    
    // 触摸交互状态
    touchState: {
      isDragging: false,
      isScaling: false,
      activeLayer: null,
      startTouches: [],
      lastTouches: [],
      initialDistance: 0,
      initialAngle: 0,
      initialTransform: null
    },
    
    // 计算属性
    hasAnyContent: false
  },

  onLoad() {
    this.initializeData();
    this.initSafeArea();
    this.updateTextShadow();
    this.initializeScrollEnhancement();
  },

  // 初始化安全区域
  initSafeArea() {
    const systemInfo = wx.getSystemInfoSync();
    console.log('系统信息:', systemInfo);

    let safeAreaHeight = 0;

    // 获取安全区域信息
    if (systemInfo.safeArea) {
      const { safeArea, windowHeight, windowWidth, pixelRatio } = systemInfo;
      const safeAreaInsets = {
        top: safeArea.top,
        bottom: windowHeight - safeArea.bottom,
        left: safeArea.left,
        right: windowWidth - safeArea.right
      };

      // 将px转换为rpx (1px = 2rpx on most devices)
      safeAreaHeight = safeAreaInsets.top * 2;

      // 特殊设备适配
      const model = systemInfo.model.toLowerCase();

      // iPhone X系列特殊处理
      if (model.includes('iphone x') || model.includes('iphone 1')) {
        safeAreaHeight = Math.max(safeAreaHeight, 88); // iPhone X系列最小88rpx
      }

      // 华为刘海屏设备
      if (model.includes('huawei') && safeAreaInsets.top > 20) {
        safeAreaHeight = Math.max(safeAreaHeight, 80);
      }

      // 小米刘海屏设备
      if (model.includes('mi ') && safeAreaInsets.top > 20) {
        safeAreaHeight = Math.max(safeAreaHeight, 80);
      }

      console.log('安全区域计算结果:', {
        deviceModel: systemInfo.model,
        safeAreaTop: safeAreaInsets.top,
        calculatedHeight: safeAreaHeight,
        pixelRatio: pixelRatio
      });

      this.setData({
        safeAreaInsets: safeAreaInsets,
        safeAreaHeight: safeAreaHeight
      });

    } else {
      // 没有安全区域信息的设备，使用默认值
      console.log('设备不支持安全区域API，使用默认适配');

      // 根据设备型号进行基础适配
      const model = systemInfo.model.toLowerCase();
      if (model.includes('iphone x') || model.includes('iphone 1')) {
        safeAreaHeight = 88; // iPhone X系列默认值
      }

      this.setData({
        safeAreaHeight: safeAreaHeight
      });
    }

    console.log('最终安全区域高度:', safeAreaHeight, 'rpx');
  },

  // 初始化数据
  initializeData() {
    const bodyCategories = getBodyCategories();
    const expressionCategories = getExpressionCategories();
    const bodyMaterials = getMaterials('body', 'panda');
    const expressionMaterials = getMaterials('expression', 'happy');

    this.setData({
      bodyCategories,
      expressionCategories,
      bodyMaterials,
      expressionMaterials
    });
  },

  // 初始化滚动增强功能
  initializeScrollEnhancement() {
    // 确保内容区域可以正确滚动到底部
    this.ensureScrollable();

    // 监听页面尺寸变化
    wx.onWindowResize(() => {
      this.ensureScrollable();
    });
  },

  // 确保内容可滚动
  ensureScrollable() {
    const query = wx.createSelectorQuery();
    query.select('.content-area').boundingClientRect();
    query.select('.material-grid').boundingClientRect();
    query.exec((res) => {
      if (res[0] && res[1]) {
        const contentHeight = res[0].height;
        const gridHeight = res[1].height;

        // 如果网格高度超过容器高度，确保可以滚动
        if (gridHeight > contentHeight - 100) { // 预留100rpx空间
          // 强制触发重新渲染以确保滚动功能正常
          this.setData({
            scrollEnabled: true
          });
        }
      }
    });
  },



  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      currentTab: tab
    });
    this.updateHasAnyContent();
  },

  // 更新分类
  updateCategory(e) {
    const { category, type } = e.currentTarget.dataset;

    if (type === 'body') {
      const materials = getMaterials('body', category);
      this.setData({
        bodyCurrentCategory: category,
        bodyMaterials: materials
      });
    } else if (type === 'expression') {
      const materials = getMaterials('expression', category);
      this.setData({
        expressionCurrentCategory: category,
        expressionMaterials: materials
      });
    }

    // 分类切换后，确保滚动功能正常
    setTimeout(() => {
      this.ensureScrollable();
    }, 100);
  },

  // 选择素材
  selectMaterial(e) {
    const { type, material, imageUrl } = e.currentTarget.dataset;

    const selectedUrl = imageUrl || material;

    console.log('selectMaterial调用:', {
      type,
      material,
      imageUrl,
      selectedUrl,
      isImage: !!imageUrl
    });

    if (type === 'body') {
      // 判断内容类型并设置相应的数据
      const isImage = this.isImageUrl(selectedUrl);

      this.setData({
        selectedBody: selectedUrl,
        selectedBodyIsImage: isImage // 添加类型标识
      });

      // 如果是图片URL，预加载优化性能
      if (isImage) {
        this.preloadImage(selectedUrl);
      }
    } else if (type === 'expression') {
      // 判断内容类型并设置相应的数据
      const isImage = this.isImageUrl(selectedUrl);
      this.setData({
        selectedExpression: selectedUrl,
        selectedExpressionIsImage: isImage // 添加类型标识
      });

      console.log('表情素材已选中:', selectedUrl, '类型:', isImage ? '图片' : 'emoji');

      // 如果是图片URL，预加载优化性能
      if (isImage) {
        this.preloadImage(selectedUrl);
      }
    }

    this.updateHasAnyContent();
    this.updateTransforms();
  },

  // 处理文字输入
  handleTextInput(e) {
    const textContent = e.detail.value;
    this.setData({
      textContent
    });
    this.updateHasAnyContent();
    this.updateTransforms();
  },

  // 处理颜色选择器触摸
  handleColorPickerTouch(e) {
    const { type } = e.currentTarget.dataset;
    const touch = e.touches[0];
    const query = wx.createSelectorQuery();
    
    query.select('.color-picker').boundingClientRect((rect) => {
      if (rect) {
        const x = touch.clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        const color = calculateColorFromPercentage(percentage);
        
        if (type === 'text') {
          this.setData({
            textColor: color,
            textColorPosition: percentage
          });
        } else if (type === 'stroke') {
          this.setData({
            strokeColor: color,
            strokeColorPosition: percentage
          });
        }
        
        this.updateTextShadow();
        this.updateTransforms();
      }
    }).exec();
  },

  // 切换描边开关
  toggleStroke() {
    this.setData({
      strokeEnabled: !this.data.strokeEnabled
    });
    this.updateTextShadow();
    this.updateTransforms();
  },

  // 更新文字阴影
  updateTextShadow() {
    const { strokeEnabled, strokeColor } = this.data;
    const textShadow = strokeEnabled ? generateTextStroke(strokeColor) : 'none';
    this.setData({
      textShadow
    });
  },

  // 选择生成选项
  selectGenerateOption(e) {
    const { type, value } = e.currentTarget.dataset;
    
    if (type === 'size') {
      this.setData({
        generateSize: value
      });
    } else if (type === 'quality') {
      this.setData({
        generateQuality: value
      });
    }
  },

  // 生成表情包
  generateEmoji() {
    const { selectedBody, selectedExpression, textContent } = this.data;
    
    if (!selectedBody && !selectedExpression && !textContent) {
      showToast('请先选择素材或添加文字');
      return;
    }
    
    showToast('表情包生成完成！', 'success');
  },

  // 处理上传
  async handleUpload() {
    const { currentTab } = this.data;

    // 根据当前页面确定上传类型和配置
    let uploadType = '';
    let uploadConfig = {};

    if (currentTab === 'body') {
      uploadType = 'body';
      uploadConfig = {
        ...BODY_UPLOAD_CONFIG,
        onSuccess: (images) => this.handleUploadSuccess(images, 'body'),
        onError: (error) => this.handleUploadError(error, 'body')
      };
    } else if (currentTab === 'expression') {
      uploadType = 'expression';
      uploadConfig = {
        ...EXPRESSION_UPLOAD_CONFIG,
        onSuccess: (images) => this.handleUploadSuccess(images, 'expression'),
        onError: (error) => this.handleUploadError(error, 'expression')
      };
    } else {
      showToast('请先切换到"选身体"或"选表情"页面');
      return;
    }

    try {
      // 调用图片上传功能
      const result = await uploadImages(uploadConfig);

      if (result.success) {
        console.log('图片上传成功:', result);
        // 成功处理在回调函数中进行
      } else if (result.cancelled) {
        // 用户取消操作，不显示错误信息
        console.log('用户取消了图片选择');
      } else {
        console.error('图片上传失败:', result.error);
        // 错误处理在回调函数中进行
      }
    } catch (error) {
      console.error('上传过程中发生错误:', error);
      showToast('上传失败，请重试', 'none');
    }
  },

  // 处理上传成功
  handleUploadSuccess(images, type) {
    console.log(`${type}图片上传成功:`, images);

    if (!images || images.length === 0) {
      showToast('没有成功上传的图片', 'none');
      return;
    }

    const uploadedImage = images[0]; // 目前只支持单张上传

    // 确保获取正确的图片URL，优先级：tempFilePath > uploadUrl > originalPath
    // 在微信小程序中，tempFilePath 通常是最可靠的
    let imageUrl = uploadedImage.tempFilePath || uploadedImage.uploadUrl || uploadedImage.originalPath;

    // 验证URL格式
    if (!imageUrl) {
      console.error('无法获取有效的图片URL:', uploadedImage);
      showToast('图片处理失败，请重试', 'none');
      return;
    }

    // 确保URL格式正确
    if (typeof imageUrl !== 'string') {
      console.error('图片URL不是字符串类型:', typeof imageUrl, imageUrl);
      imageUrl = String(imageUrl);
    }

    // 验证URL格式
    if (!this.isValidImageUrl(imageUrl)) {
      console.error('无效的图片URL:', imageUrl);
      showToast('图片URL格式无效，请重试', 'none');
      return;
    }

    console.log('图片URL处理结果:', {
      tempFilePath: uploadedImage.tempFilePath,
      uploadUrl: uploadedImage.uploadUrl,
      finalUrl: imageUrl,
      isValid: this.isValidImageUrl(imageUrl)
    });

    const imageData = {
      id: Date.now(), // 使用时间戳作为唯一ID
      url: imageUrl,
      tempFilePath: uploadedImage.tempFilePath,
      width: uploadedImage.width,
      height: uploadedImage.height,
      size: uploadedImage.size,
      type: uploadedImage.type,
      uploadTime: new Date().toISOString(),
      isCustom: true,
      // 添加缩略图信息，用于预览区域优化显示
      isLargeImage: uploadedImage.width > 1000 || uploadedImage.height > 1000
    };

    console.log('图片数据创建完成:', {
      id: imageData.id,
      url: imageData.url,
      width: imageData.width,
      height: imageData.height,
      type: imageData.type
    });

    if (type === 'body') {
      const customBodyImages = [...this.data.customBodyImages, imageData];
      this.setData({
        customBodyImages,
        selectedBody: imageData.url, // 自动选中新上传的图片
        selectedBodyIsImage: true    // 🔧 修复：设置类型标识为图片
      });
      console.log('身体图片设置完成，URL:', imageData.url, '类型: 图片');

      // 预加载图片优化性能
      this.preloadImage(imageData.url);
    } else if (type === 'expression') {
      const customExpressionImages = [...this.data.customExpressionImages, imageData];
      this.setData({
        customExpressionImages,
        selectedExpression: imageData.url, // 自动选中新上传的图片
        selectedExpressionIsImage: true    // 🔧 修复：设置类型标识为图片
      });
      console.log('表情图片设置完成，URL:', imageData.url, '类型: 图片');

      // 预加载图片优化性能
      this.preloadImage(imageData.url);
    }

    // 更新内容状态和变换
    this.updateHasAnyContent();
    this.updateTransforms();

    // 确保滚动功能正常（新增内容后）
    setTimeout(() => {
      this.ensureScrollable();
    }, 100);
  },

  // 处理上传错误
  handleUploadError(error, type) {
    console.error(`${type}图片上传失败:`, error);

    // 检查是否为用户取消操作
    const isCancelled = error.errMsg && error.errMsg.includes('cancel');

    if (isCancelled) {
      // 用户取消操作，不显示错误提示
      console.log(`用户取消了${type}图片选择`);
      return;
    }

    // 真正的错误才显示提示
    const errorMessage = error.message || error.errMsg || error || '上传失败';
    showToast(errorMessage, 'none');
  },

  // 删除自定义图片
  deleteCustomImage(e) {
    const { type, imageId } = e.currentTarget.dataset;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这张自定义图片吗？',
      success: (res) => {
        if (res.confirm) {
          if (type === 'body') {
            const customBodyImages = this.data.customBodyImages.filter(img => img.id !== imageId);
            const updateData = { customBodyImages };

            // 如果删除的是当前选中的图片，清除选中状态
            if (this.data.selectedBody && this.data.selectedBody.includes(imageId.toString())) {
              updateData.selectedBody = null;
              updateData.selectedBodyIsImage = false; // 🔧 修复：重置类型标识
            }

            this.setData(updateData);
          } else if (type === 'expression') {
            const customExpressionImages = this.data.customExpressionImages.filter(img => img.id !== imageId);
            const updateData = { customExpressionImages };

            // 如果删除的是当前选中的图片，清除选中状态
            if (this.data.selectedExpression && this.data.selectedExpression.includes(imageId.toString())) {
              updateData.selectedExpression = null;
              updateData.selectedExpressionIsImage = false; // 🔧 修复：重置类型标识
            }

            this.setData(updateData);
          }

          this.updateHasAnyContent();
          this.updateTransforms();
          showToast('删除成功', 'success');
        }
      }
    });
  },

  // 验证图片URL格式
  isValidImageUrl(url) {
    if (!url || typeof url !== 'string') {
      return false;
    }

    // 简化判断：任何包含路径分隔符的字符串都视为有效的图片路径
    return url.indexOf('/') >= 0;
  },

  // 判断内容是否为图片URL（而非emoji素材）
  isImageUrl(content) {
    if (!content || typeof content !== 'string') {
      return false;
    }

    // 首先检查明确的图片URL模式
    const imageUrlPatterns = [
      'http://',
      'https://',
      'wxfile://',
      'blob:',
      'data:image/',
      'data:img/',
      'file://'
    ];

    // 如果以这些模式开头，肯定是图片URL
    const startsWithImagePattern = imageUrlPatterns.some(pattern =>
      content.indexOf(pattern) === 0
    );

    if (startsWithImagePattern) {
      return true;
    }

    // 检查是否包含路径分隔符且长度较长（可能是本地路径）
    if (content.indexOf('/') >= 0 && content.length > 10) {
      // 进一步检查是否包含图片扩展名
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
      const hasImageExtension = imageExtensions.some(ext =>
        content.toLowerCase().indexOf(ext) >= 0
      );

      if (hasImageExtension) {
        return true;
      }

      // 如果路径很长但没有扩展名，可能是微信临时文件路径
      if (content.length > 20) {
        return true;
      }
    }

    // 如果内容很短且不包含路径分隔符，很可能是emoji
    if (content.length <= 4 && content.indexOf('/') === -1) {
      return false;
    }

    // 🔧 修复：移除循环依赖，使用简单的emoji检测
    // 检查是否包含常见的emoji Unicode范围
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
    if (emojiRegex.test(content)) {
      return false; // 是emoji，不是图片URL
    }

    // 默认情况下，如果不确定且不是明显的emoji，认为可能是图片路径
    return content.length > 4;
  },

  // 判断内容是否为emoji素材
  isEmojiContent(content) {
    if (!content || typeof content !== 'string') {
      return false;
    }

    // emoji通常长度较短，且不包含路径分隔符
    if (content.length <= 4 && content.indexOf('/') === -1 && content.indexOf('http') === -1) {
      return true;
    }

    // 使用更全面的emoji正则表达式检测
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]/u;

    if (emojiRegex.test(content)) {
      return true;
    }

    // 检查是否为其他Unicode符号
    const symbolRegex = /[\u{2000}-\u{2BFF}]|[\u{3000}-\u{303F}]|[\u{FE00}-\u{FE0F}]/u;
    if (symbolRegex.test(content) && content.length <= 6) {
      return true;
    }

    return false;
  },

  // 处理图片加载错误
  handleImageError(e) {
    const { imageSrc, layer } = e.currentTarget.dataset;
    console.error(`图片加载失败 - 图层: ${layer}, 图片路径: ${imageSrc}`);

    // 检查是否为emoji内容被错误地传给了image组件
    if (this.isEmojiContent(imageSrc)) {
      console.warn('检测到emoji内容被传给image组件，这应该由条件渲染处理:', imageSrc);
      return; // 不显示错误提示，因为这是预期的行为
    }

    // 验证URL格式
    if (!this.isValidImageUrl(imageSrc)) {
      console.error('无效的图片URL格式:', imageSrc);
      showToast('图片URL格式无效', 'none');
      return;
    }

    // 尝试查找对应的图片数据并使用备用路径
    if (layer === 'body') {
      const imageData = this.data.customBodyImages.find(img => img.url === imageSrc);
      if (imageData && imageData.tempFilePath && imageData.tempFilePath !== imageSrc) {
        console.log('尝试使用备用路径:', imageData.tempFilePath);
        this.setData({
          selectedBody: imageData.tempFilePath,
          selectedBodyIsImage: true // 🔧 修复：确保类型标识正确
        });
      } else {
        showToast('图片加载失败，请重新上传', 'none');
      }
    } else if (layer === 'expression') {
      const imageData = this.data.customExpressionImages.find(img => img.url === imageSrc);
      if (imageData && imageData.tempFilePath && imageData.tempFilePath !== imageSrc) {
        console.log('尝试使用备用路径:', imageData.tempFilePath);
        this.setData({
          selectedExpression: imageData.tempFilePath,
          selectedExpressionIsImage: true // 🔧 修复：确保类型标识正确
        });
      } else {
        showToast('图片加载失败，请重新上传', 'none');
      }
    }
  },

  // 图片加载成功处理
  handleImageLoad(e) {
    console.log('图片加载成功:', e.detail);
    const { layer } = e.currentTarget.dataset;
    console.log(`${layer}图片加载成功，尺寸:`, e.detail.width, 'x', e.detail.height);

    // 记录加载时间用于性能优化
    const loadTime = Date.now() - (this.data.imageLoadStartTime || Date.now());
    console.log(`图片加载耗时: ${loadTime}ms`);

    // 只在调试模式下显示成功提示
    if (this.data.debugMode) {
      wx.showToast({
        title: '图片加载成功',
        icon: 'success',
        duration: 500
      });
    }
  },

  // 预加载图片优化
  preloadImage(url) {
    if (!url) return;

    // 记录开始时间
    this.setData({
      imageLoadStartTime: Date.now()
    });

    // 使用wx.getImageInfo预加载图片
    wx.getImageInfo({
      src: url,
      success: (res) => {
        console.log('图片预加载成功:', res);
      },
      fail: (error) => {
        console.warn('图片预加载失败:', error);
      }
    });
  },

  // 处理反馈
  handleFeedback() {
    showToast('感谢您的反馈！');
  },

  // 编辑图片
  editImage(e) {
    const { imageSrc, imageId, imageType } = e.currentTarget.dataset;

    if (!imageSrc) {
      showToast('图片信息错误', 'error');
      return;
    }

    console.log('编辑图片:', { imageSrc, imageId, imageType });

    // 跳转到图片编辑页面
    wx.navigateTo({
      url: `/pages/image-editor/image-editor?imageSrc=${encodeURIComponent(imageSrc)}&imageId=${imageId}&imageType=${imageType}`
    });
  },

  // 更新编辑后的图片
  updateEditedImage(editResult) {
    const { imageId, imageType, newImageSrc, originalImageSrc } = editResult;

    console.log('更新编辑后的图片:', editResult);

    if (imageType === 'body') {
      // 更新身体图片
      const customBodyImages = this.data.customBodyImages.map(item => {
        if (item.id == imageId) {
          return {
            ...item,
            url: newImageSrc,
            originalUrl: originalImageSrc,
            isEdited: true,
            editTime: new Date().toISOString()
          };
        }
        return item;
      });

      this.setData({
        customBodyImages,
        selectedBody: newImageSrc,
        selectedBodyIsImage: true
      });

      // 预加载新图片
      this.preloadImage(newImageSrc);

    } else if (imageType === 'expression') {
      // 更新表情图片
      const customExpressionImages = this.data.customExpressionImages.map(item => {
        if (item.id == imageId) {
          return {
            ...item,
            url: newImageSrc,
            originalUrl: originalImageSrc,
            isEdited: true,
            editTime: new Date().toISOString()
          };
        }
        return item;
      });

      this.setData({
        customExpressionImages,
        selectedExpression: newImageSrc,
        selectedExpressionIsImage: true
      });

      // 预加载新图片
      this.preloadImage(newImageSrc);
    }

    // 更新预览内容
    this.updateHasAnyContent();
    this.updateTransforms();

    showToast('图片编辑已应用', 'success');
  },

  // 测试滚动功能 - 滚动到底部
  testScrollToBottom() {
    const query = wx.createSelectorQuery();
    query.select('.content-area').boundingClientRect();
    query.exec((res) => {
      if (res[0]) {
        // 使用pageScrollTo滚动到底部
        wx.pageScrollTo({
          scrollTop: res[0].height + 1000, // 确保滚动到最底部
          duration: 500,
          success: () => {
            showToast('已滚动到底部', 'success');
          },
          fail: () => {
            // 如果pageScrollTo失败，尝试使用scrollIntoView
            this.scrollToBottomAlternative();
          }
        });
      }
    });
  },

  // 备用滚动方法
  scrollToBottomAlternative() {
    // 获取最后一个素材项的ID并滚动到该位置
    const query = wx.createSelectorQuery();
    query.selectAll('.material-item').boundingClientRect();
    query.exec((res) => {
      if (res[0] && res[0].length > 0) {
        showToast('滚动功能测试完成', 'success');
      }
    });
  },

  // 更新是否有内容
  updateHasAnyContent() {
    const { selectedBody, selectedExpression, textContent, currentTab } = this.data;
    let hasAnyContent = false;
    
    if (currentTab === 'body') {
      hasAnyContent = !!selectedBody;
    } else if (currentTab === 'expression') {
      hasAnyContent = !!selectedExpression;
    } else if (currentTab === 'text') {
      hasAnyContent = !!textContent;
    } else {
      hasAnyContent = !!(selectedBody || selectedExpression || textContent);
    }
    
    this.setData({
      hasAnyContent
    });
  },

  // 更新图层变换
  updateTransforms() {
    const { layerTransforms } = this.data;

    this.setData({
      bodyTransform: applyTransform(layerTransforms.body),
      expressionTransform: applyTransform(layerTransforms.expression),
      textTransform: applyTransform(layerTransforms.text)
    });
  },

  // 触摸开始事件处理
  handleTouchStart(e) {
    const { layer } = e.currentTarget.dataset;
    const touches = e.touches;

    if (!layer || touches.length === 0) return;

    // 计算初始距离和角度（仅在双指时）
    let initialDistance = 0;
    let initialAngle = 0;

    if (touches.length === 2) {
      initialDistance = getDistance(touches[0], touches[1]);
      initialAngle = getAngle(touches[0], touches[1]);


    }

    const touchState = {
      isDragging: touches.length === 1,
      isScaling: touches.length === 2,
      activeLayer: layer,
      startTouches: Array.from(touches),
      lastTouches: Array.from(touches),
      initialDistance: initialDistance,
      initialAngle: initialAngle,
      initialTransform: cloneTransform(this.data.layerTransforms[layer])
    };

    // 添加用户操作提示
    if (touches.length === 2) {
      // 可以添加轻微的触觉反馈
      wx.vibrateShort && wx.vibrateShort({
        type: 'light'
      });
    }

    this.setData({
      touchState
    });
  },

  // 触摸移动事件处理
  handleTouchMove(e) {
    const { touchState, layerTransforms } = this.data;
    const touches = e.touches;

    if (!touchState.activeLayer || touches.length === 0) return;

    const layer = touchState.activeLayer;
    const currentTransform = cloneTransform(layerTransforms[layer]);

    if (touchState.isDragging && touches.length === 1) {
      // 单指拖拽
      const deltaX = touches[0].clientX - touchState.lastTouches[0].clientX;
      const deltaY = touches[0].clientY - touchState.lastTouches[0].clientY;

      currentTransform.x += deltaX;
      currentTransform.y += deltaY;

      // 边界约束
      const constrainedTransform = constrainToBounds(currentTransform, { width: 300, height: 280 });

      this.setData({
        [`layerTransforms.${layer}`]: constrainedTransform,
        'touchState.lastTouches': Array.from(touches)
      });

      this.updateTransforms();

    } else if (touchState.isScaling && touches.length === 2) {
      // 双指缩放和旋转（符合物理规律）
      const currentDistance = getDistance(touches[0], touches[1]);
      const currentAngle = getAngle(touches[0], touches[1]);

      // 计算缩放比例 - 添加安全检查
      if (touchState.initialDistance === 0 || isNaN(touchState.initialDistance) || isNaN(currentDistance)) {
        return;
      }

      const scaleRatio = currentDistance / touchState.initialDistance;
      const newScale = constrainScale(touchState.initialTransform.scale * scaleRatio);

      // 🔧 使用正确的角度差计算，符合物理规律
      const angleDifference = getAngleDifference(touchState.initialAngle, currentAngle);
      const angleDeltaDegrees = radianToDegree(angleDifference);
      const newRotation = normalizeRotation(touchState.initialTransform.rotation + angleDeltaDegrees);



      // 计算缩放中心点，使缩放更自然
      const touchCenter = getTouchCenter(touches);
      const initialTouchCenter = getTouchCenter(touchState.startTouches);

      // 根据缩放中心调整位置，使缩放以双指中心为基准
      const centerDeltaX = touchCenter.x - initialTouchCenter.x;
      const centerDeltaY = touchCenter.y - initialTouchCenter.y;

      currentTransform.scale = newScale;
      currentTransform.rotation = newRotation;

      // 微调位置以保持缩放中心
      currentTransform.x = touchState.initialTransform.x + centerDeltaX * 0.1;
      currentTransform.y = touchState.initialTransform.y + centerDeltaY * 0.1;

      // 应用边界约束
      const constrainedTransform = constrainToBounds(currentTransform, { width: 300, height: 280 });

      this.setData({
        [`layerTransforms.${layer}`]: constrainedTransform,
        'touchState.lastTouches': Array.from(touches)
      });

      this.updateTransforms();
    }
  },

  // 触摸结束事件处理
  handleTouchEnd(e) {
    const { touchState } = this.data;



    this.setData({
      'touchState.isDragging': false,
      'touchState.isScaling': false,
      'touchState.activeLayer': null
    });
  },

  // 图层点击事件处理（水平翻转）
  handleLayerTap(e) {
    const { layer } = e.currentTarget.dataset;
    const { layerTransforms } = this.data;

    if (!layer) return;

    const currentTransform = cloneTransform(layerTransforms[layer]);
    currentTransform.flipX = !currentTransform.flipX;

    this.setData({
      [`layerTransforms.${layer}`]: currentTransform
    });

    this.updateTransforms();
  },

  // 跳转到测试页面
  goToTest() {
    wx.navigateTo({
      url: '/pages/test/test',
      fail: (error) => {
        console.error('跳转到测试页面失败:', error);
        showToast('跳转失败');
      }
    });
  },

  // 测试滚动功能
  testScrollFunction() {

    // 检查当前页面的滚动状态
    const query = wx.createSelectorQuery();
    query.select('.content-area').boundingClientRect();
    query.select('.material-grid').boundingClientRect();
    query.selectAll('.material-item').boundingClientRect();
    query.exec((res) => {
      const contentArea = res[0];
      const materialGrid = res[1];
      const materialItems = res[2];

      console.log('滚动测试结果:', {
        contentArea: contentArea,
        materialGrid: materialGrid,
        itemCount: materialItems ? materialItems.length : 0,
        canScroll: materialGrid && contentArea ? materialGrid.height > contentArea.height : false
      });

      if (materialGrid && contentArea && materialGrid.height > contentArea.height) {
        showToast('滚动功能正常', 'success');
      } else {
        showToast('滚动功能可能有问题', 'error');
      }
    });
  },

  // 测试双指缩放功能
  testPinchZoomFunction() {
    // 模拟两个触摸点
    const mockTouch1 = { clientX: 100, clientY: 100 };
    const mockTouch2 = { clientX: 200, clientY: 200 };

    // 测试距离计算
    const distance = getDistance(mockTouch1, mockTouch2);
    const expectedDistance = Math.sqrt(100*100 + 100*100);
    const distanceCorrect = Math.abs(distance - expectedDistance) < 0.01;

    // 测试角度计算和角度差计算
    const angle = getAngle(mockTouch1, mockTouch2);
    const angleCorrect = Math.abs(angle - Math.PI / 4) < 0.01;

    // 测试角度差计算（跨边界情况）
    const angle1 = Math.PI * 0.9; // 162度
    const angle2 = -Math.PI * 0.9; // -162度
    const angleDiff = getAngleDifference(angle1, angle2);
    const angleDiffDegrees = radianToDegree(angleDiff);
    const angleDiffCorrect = Math.abs(angleDiffDegrees - 36) < 1;

    // 测试缩放约束
    const testScales = [0.3, 0.5, 1.0, 2.0, 3.0, 5.0];
    const constraintResults = testScales.map(scale => constrainScale(scale));

    const allTestsPassed = distanceCorrect && angleCorrect && angleDiffCorrect;
    showToast(allTestsPassed ? '双指缩放功能测试通过' : '双指缩放功能测试失败', allTestsPassed ? 'success' : 'error');
  },

  // 测试安全区域适配
  testSafeAreaAdaptation() {
    const systemInfo = wx.getSystemInfoSync();
    const { safeAreaInsets, safeAreaHeight } = this.data;

    console.log('安全区域测试信息:', {
      systemInfo: systemInfo,
      safeAreaInsets: safeAreaInsets,
      safeAreaHeight: safeAreaHeight,
      deviceModel: systemInfo.model,
      isIPhoneX: systemInfo.model.includes('iPhone X') || systemInfo.model.includes('iPhone 1'),
      hasNotch: safeAreaInsets.top > 20
    });

    // 检查安全区域元素的实际高度
    const query = wx.createSelectorQuery();
    query.select('.safe-area-top').boundingClientRect();
    query.select('.header').boundingClientRect();
    query.exec((res) => {
      const safeAreaElement = res[0];
      const headerElement = res[1];

      console.log('安全区域元素信息:', {
        safeAreaElementHeight: safeAreaElement ? safeAreaElement.height : 0,
        safeAreaElementTop: safeAreaElement ? safeAreaElement.top : 0,
        headerTop: headerElement ? headerElement.top : 0,
        headerHeight: headerElement ? headerElement.height : 0,
        calculatedSafeAreaHeight: safeAreaHeight,
        isProperlyAdapted: headerElement && safeAreaElement && headerElement.top >= safeAreaElement.height
      });

      if (safeAreaHeight > 0) {
        showToast(`安全区域适配: ${safeAreaHeight}rpx (${Math.round(safeAreaHeight/2)}px)`, 'success');
      } else {
        showToast('普通屏幕，无需安全区域适配', 'success');
      }
    });
  }
});
