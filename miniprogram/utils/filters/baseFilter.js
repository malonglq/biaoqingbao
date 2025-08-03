// baseFilter.js - 基础滤镜类
/**
 * 基础滤镜类，所有滤镜都应继承此类
 */
class BaseFilter {
  constructor(name, displayName) {
    this.name = name;
    this.displayName = displayName;
    this.intensity = 100; // 默认强度100%
    this.isEnabled = false;
    this.previewMode = false; // 是否为预览模式
  }

  /**
   * 设置滤镜强度
   * @param {number} intensity - 强度值 (0-100)
   */
  setIntensity(intensity) {
    this.intensity = Math.max(0, Math.min(100, intensity));
  }

  /**
   * 获取滤镜强度
   * @returns {number} 强度值
   */
  getIntensity() {
    return this.intensity;
  }

  /**
   * 启用滤镜
   */
  enable() {
    this.isEnabled = true;
  }

  /**
   * 禁用滤镜
   */
  disable() {
    this.isEnabled = false;
  }

  /**
   * 设置预览模式
   * @param {boolean} preview - 是否为预览模式
   */
  setPreviewMode(preview) {
    this.previewMode = preview;
  }

  /**
   * 应用滤镜到图像数据
   * @param {ImageData} imageData - 原始图像数据
   * @returns {ImageData} 处理后的图像数据
   */
  apply(imageData) {
    throw new Error('apply方法必须在子类中实现');
  }

  /**
   * 获取滤镜配置信息
   * @returns {Object} 配置信息
   */
  getConfig() {
    return {
      name: this.name,
      displayName: this.displayName,
      intensity: this.intensity,
      isEnabled: this.isEnabled,
      previewMode: this.previewMode
    };
  }

  /**
   * 从配置恢复滤镜状态
   * @param {Object} config - 配置信息
   */
  fromConfig(config) {
    this.intensity = config.intensity || 100;
    this.isEnabled = config.isEnabled || false;
    this.previewMode = config.previewMode || false;
  }

  /**
   * 重置滤镜到默认状态
   */
  reset() {
    this.intensity = 100;
    this.isEnabled = false;
    this.previewMode = false;
  }

  /**
   * 验证图像数据
   * @param {ImageData} imageData - 图像数据
   * @returns {boolean} 是否有效
   */
  validateImageData(imageData) {
    return imageData && 
           imageData.data && 
           imageData.width > 0 && 
           imageData.height > 0 &&
           imageData.data.length === imageData.width * imageData.height * 4;
  }

  /**
   * 克隆图像数据
   * @param {ImageData} imageData - 原始图像数据
   * @returns {ImageData} 克隆的图像数据
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
          // 备用方案：直接返回原始数据结构
          return {
            data: clonedData,
            width: imageData.width,
            height: imageData.height
          };
        }
      } else if (typeof ImageData !== 'undefined') {
        // 浏览器环境，直接使用ImageData构造函数
        return new ImageData(clonedData, imageData.width, imageData.height);
      } else {
        // 备用方案：返回简单的数据结构
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
   * 混合两个颜色值
   * @param {number} original - 原始值
   * @param {number} filtered - 滤镜处理后的值
   * @param {number} intensity - 混合强度 (0-100)
   * @returns {number} 混合后的值
   */
  blendValue(original, filtered, intensity) {
    const factor = intensity / 100;
    return Math.round(original * (1 - factor) + filtered * factor);
  }

  /**
   * 应用强度混合
   * @param {ImageData} originalData - 原始图像数据
   * @param {ImageData} filteredData - 滤镜处理后的图像数据
   * @param {number} intensity - 强度 (0-100)
   * @returns {ImageData} 混合后的图像数据
   */
  applyIntensityBlend(originalData, filteredData, intensity) {
    if (intensity === 100) {
      return filteredData;
    }
    
    if (intensity === 0) {
      return originalData;
    }

    const result = this.cloneImageData(originalData);
    if (!result) return originalData;

    const originalPixels = originalData.data;
    const filteredPixels = filteredData.data;
    const resultPixels = result.data;

    for (let i = 0; i < originalPixels.length; i += 4) {
      // RGB通道应用强度混合
      resultPixels[i] = this.blendValue(originalPixels[i], filteredPixels[i], intensity);
      resultPixels[i + 1] = this.blendValue(originalPixels[i + 1], filteredPixels[i + 1], intensity);
      resultPixels[i + 2] = this.blendValue(originalPixels[i + 2], filteredPixels[i + 2], intensity);
      // Alpha通道保持不变
      resultPixels[i + 3] = originalPixels[i + 3];
    }

    return result;
  }
}

module.exports = BaseFilter;
