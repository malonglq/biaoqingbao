// filterManager.js - 滤镜管理器
const GrayscaleFilter = require('./filters/grayscaleFilter.js');

/**
 * 滤镜管理器
 * 负责管理所有滤镜的注册、应用和状态管理
 */
class FilterManager {
  constructor() {
    this.filters = new Map();
    this.activeFilter = null;
    this.originalImageData = null;
    this.currentImageData = null;
    this.previewImageData = null;
    this.isPreviewMode = false;
    
    // 注册内置滤镜
    this.registerBuiltinFilters();
  }

  /**
   * 注册内置滤镜
   */
  registerBuiltinFilters() {
    try {
      this.registerFilter(new GrayscaleFilter());
      console.log('内置滤镜注册完成');
      // 后续可以在这里注册更多滤镜
      // this.registerFilter(new OpacityFilter());
      // this.registerFilter(new BlurFilter());
    } catch (error) {
      console.error('注册内置滤镜失败:', error);
    }
  }

  /**
   * 注册滤镜
   * @param {BaseFilter} filter - 滤镜实例
   */
  registerFilter(filter) {
    if (!filter || !filter.name) {
      console.error('无效的滤镜实例');
      return false;
    }
    
    this.filters.set(filter.name, filter);
    console.log(`滤镜 "${filter.displayName}" 注册成功`);
    return true;
  }

  /**
   * 获取所有已注册的滤镜
   * @returns {Array} 滤镜列表
   */
  getAllFilters() {
    return Array.from(this.filters.values());
  }

  /**
   * 获取滤镜信息列表（用于UI显示）
   * @returns {Array} 滤镜信息列表
   */
  getFilterList() {
    return this.getAllFilters().map(filter => ({
      name: filter.name,
      displayName: filter.displayName,
      isEnabled: filter.isEnabled,
      intensity: filter.intensity
    }));
  }

  /**
   * 根据名称获取滤镜
   * @param {string} name - 滤镜名称
   * @returns {BaseFilter|null} 滤镜实例
   */
  getFilter(name) {
    return this.filters.get(name) || null;
  }

  /**
   * 设置原始图像数据
   * @param {ImageData} imageData - 原始图像数据
   */
  setOriginalImageData(imageData) {
    if (!imageData) {
      console.error('无效的图像数据');
      return false;
    }
    
    this.originalImageData = this.cloneImageData(imageData);
    this.currentImageData = this.cloneImageData(imageData);
    this.previewImageData = null;
    
    // 重置所有滤镜状态
    this.resetAllFilters();
    
    return true;
  }

  /**
   * 激活滤镜
   * @param {string} filterName - 滤镜名称
   * @returns {boolean} 是否成功激活
   */
  activateFilter(filterName) {
    const filter = this.getFilter(filterName);
    if (!filter) {
      console.error(`滤镜 "${filterName}" 不存在`);
      return false;
    }

    // 如果有其他激活的滤镜，先禁用
    if (this.activeFilter && this.activeFilter !== filter) {
      this.activeFilter.disable();
    }

    this.activeFilter = filter;
    filter.enable();
    
    console.log(`滤镜 "${filter.displayName}" 已激活`);
    return true;
  }

  /**
   * 取消激活当前滤镜
   */
  deactivateFilter() {
    if (this.activeFilter) {
      this.activeFilter.disable();
      this.activeFilter = null;
      this.exitPreviewMode();
    }
  }

  /**
   * 获取当前激活的滤镜
   * @returns {BaseFilter|null} 当前激活的滤镜
   */
  getActiveFilter() {
    return this.activeFilter;
  }

  /**
   * 设置当前激活滤镜的强度
   * @param {number} intensity - 强度值 (0-100)
   * @returns {boolean} 是否设置成功
   */
  setFilterIntensity(intensity) {
    if (!this.activeFilter) {
      console.error('没有激活的滤镜');
      return false;
    }

    this.activeFilter.setIntensity(intensity);
    return true;
  }

  /**
   * 获取当前激活滤镜的强度
   * @returns {number} 强度值
   */
  getFilterIntensity() {
    return this.activeFilter ? this.activeFilter.getIntensity() : 0;
  }

  /**
   * 进入预览模式
   * @param {number} intensity - 预览强度
   * @returns {ImageData|null} 预览图像数据
   */
  enterPreviewMode(intensity) {
    if (!this.activeFilter || !this.originalImageData) {
      return null;
    }

    this.isPreviewMode = true;
    this.activeFilter.setPreviewMode(true);
    
    // 应用滤镜预览
    this.previewImageData = this.activeFilter.preview(this.originalImageData, intensity);
    
    return this.previewImageData;
  }

  /**
   * 退出预览模式
   */
  exitPreviewMode() {
    this.isPreviewMode = false;
    this.previewImageData = null;
    
    if (this.activeFilter) {
      this.activeFilter.setPreviewMode(false);
    }
  }

  /**
   * 应用当前激活的滤镜
   * @returns {ImageData|null} 应用滤镜后的图像数据
   */
  applyActiveFilter() {
    if (!this.activeFilter || !this.originalImageData) {
      console.error('没有激活的滤镜或原始图像数据');
      return null;
    }

    // 退出预览模式
    this.exitPreviewMode();
    
    // 应用滤镜到原始图像
    this.currentImageData = this.activeFilter.apply(this.originalImageData);
    
    // 更新原始图像数据为当前结果（支持多次滤镜叠加）
    this.originalImageData = this.cloneImageData(this.currentImageData);
    
    // 重置滤镜状态
    this.activeFilter.reset();
    this.activeFilter = null;
    
    console.log('滤镜应用成功');
    return this.currentImageData;
  }

  /**
   * 获取当前图像数据
   * @returns {ImageData|null} 当前图像数据
   */
  getCurrentImageData() {
    if (this.isPreviewMode && this.previewImageData) {
      return this.previewImageData;
    }
    return this.currentImageData;
  }

  /**
   * 获取原始图像数据
   * @returns {ImageData|null} 原始图像数据
   */
  getOriginalImageData() {
    return this.originalImageData;
  }

  /**
   * 重置所有滤镜
   */
  resetAllFilters() {
    this.filters.forEach(filter => {
      filter.reset();
    });
    this.activeFilter = null;
    this.exitPreviewMode();
  }

  /**
   * 重置到原始图像
   */
  resetToOriginal() {
    if (this.originalImageData) {
      this.currentImageData = this.cloneImageData(this.originalImageData);
      this.resetAllFilters();
    }
  }

  /**
   * 克隆图像数据
   * @param {ImageData} imageData - 原始图像数据
   * @returns {ImageData|null} 克隆的图像数据
   */
  cloneImageData(imageData) {
    try {
      if (!imageData || !imageData.data) {
        console.error('无效的图像数据');
        return null;
      }

      const clonedData = new Uint8ClampedArray(imageData.data);

      // 在微信小程序环境中，需要通过Canvas上下文创建ImageData
      if (typeof wx !== 'undefined' && wx.createOffscreenCanvas) {
        try {
          const canvas = wx.createOffscreenCanvas({ type: '2d' });
          canvas.width = imageData.width;
          canvas.height = imageData.height;
          const ctx = canvas.getContext('2d');

          const newImageData = ctx.createImageData(imageData.width, imageData.height);
          newImageData.data.set(clonedData);
          return newImageData;
        } catch (wxError) {
          console.warn('微信小程序Canvas创建失败，使用备用方案:', wxError);
          return {
            data: clonedData,
            width: imageData.width,
            height: imageData.height
          };
        }
      } else if (typeof ImageData !== 'undefined') {
        return new ImageData(clonedData, imageData.width, imageData.height);
      } else {
        return {
          data: clonedData,
          width: imageData.width,
          height: imageData.height
        };
      }
    } catch (error) {
      console.error('复制ImageData失败:', error);
      return null;
    }
  }

  /**
   * 获取管理器状态
   * @returns {Object} 状态信息
   */
  getStatus() {
    return {
      hasOriginalImage: !!this.originalImageData,
      hasCurrentImage: !!this.currentImageData,
      isPreviewMode: this.isPreviewMode,
      activeFilter: this.activeFilter ? this.activeFilter.name : null,
      registeredFilters: this.getFilterList()
    };
  }

  /**
   * 清理资源
   */
  cleanup() {
    this.originalImageData = null;
    this.currentImageData = null;
    this.previewImageData = null;
    this.resetAllFilters();
    console.log('滤镜管理器资源已清理');
  }
}

module.exports = FilterManager;
