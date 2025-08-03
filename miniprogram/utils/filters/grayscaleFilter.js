// grayscaleFilter.js - 黑白滤镜模块
const BaseFilter = require('./baseFilter.js');

/**
 * 黑白滤镜类
 * 实现移除饱和度并增强对比度的黑白效果
 */
class GrayscaleFilter extends BaseFilter {
  constructor() {
    super('grayscale', '黑白');
    this.contrastBoost = 1.2; // 对比度增强系数
  }

  /**
   * 设置对比度增强系数
   * @param {number} boost - 对比度增强系数 (1.0-2.0)
   */
  setContrastBoost(boost) {
    this.contrastBoost = Math.max(1.0, Math.min(2.0, boost));
  }

  /**
   * 应用黑白滤镜
   * @param {ImageData} imageData - 原始图像数据
   * @returns {ImageData} 处理后的图像数据
   */
  apply(imageData) {
    if (!this.validateImageData(imageData)) {
      console.error('无效的图像数据');
      return imageData;
    }

    // 如果强度为0，直接返回原图
    if (this.intensity === 0) {
      return imageData;
    }

    // 克隆图像数据
    const result = this.cloneImageData(imageData);
    if (!result) return imageData;

    // 应用黑白滤镜
    const filteredData = this.applyGrayscaleEffect(result);
    
    // 如果强度不是100%，需要与原图混合
    if (this.intensity < 100) {
      return this.applyIntensityBlend(imageData, filteredData, this.intensity);
    }

    return filteredData;
  }

  /**
   * 应用黑白效果
   * @param {ImageData} imageData - 图像数据
   * @returns {ImageData} 处理后的图像数据
   */
  applyGrayscaleEffect(imageData) {
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // 使用加权平均法计算灰度值（更符合人眼感知）
      let gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      
      // 应用对比度增强
      gray = this.enhanceContrast(gray);
      
      // 确保值在有效范围内
      gray = Math.max(0, Math.min(255, gray));
      
      // 设置RGB通道为相同的灰度值
      data[i] = gray;     // R
      data[i + 1] = gray; // G
      data[i + 2] = gray; // B
      // data[i + 3] 保持不变 (Alpha通道)
    }
    
    return imageData;
  }

  /**
   * 增强对比度
   * @param {number} value - 原始灰度值 (0-255)
   * @returns {number} 增强后的灰度值
   */
  enhanceContrast(value) {
    // 将值标准化到 -1 到 1 的范围
    const normalized = (value / 255) * 2 - 1;
    
    // 应用对比度增强
    const enhanced = normalized * this.contrastBoost;
    
    // 使用S曲线进一步增强对比度
    const curved = this.applySCurve(enhanced);
    
    // 转换回 0-255 范围
    return Math.round((curved + 1) * 127.5);
  }

  /**
   * 应用S曲线增强对比度
   * @param {number} x - 输入值 (-1 到 1)
   * @returns {number} 输出值 (-1 到 1)
   */
  applySCurve(x) {
    // 限制输入范围
    x = Math.max(-1, Math.min(1, x));
    
    // 使用tanh函数创建S曲线
    const factor = 1.5; // S曲线强度
    return Math.tanh(x * factor) / Math.tanh(factor);
  }

  /**
   * 获取滤镜的详细配置
   * @returns {Object} 详细配置信息
   */
  getDetailedConfig() {
    return {
      ...this.getConfig(),
      contrastBoost: this.contrastBoost,
      algorithm: 'weighted_average_with_contrast_enhancement',
      weights: { r: 0.299, g: 0.587, b: 0.114 }
    };
  }

  /**
   * 从详细配置恢复滤镜状态
   * @param {Object} config - 详细配置信息
   */
  fromDetailedConfig(config) {
    this.fromConfig(config);
    if (config.contrastBoost !== undefined) {
      this.setContrastBoost(config.contrastBoost);
    }
  }

  /**
   * 重置滤镜到默认状态
   */
  reset() {
    super.reset();
    this.contrastBoost = 1.2;
  }

  /**
   * 预览模式应用（用于实时预览）
   * @param {ImageData} imageData - 原始图像数据
   * @param {number} intensity - 预览强度
   * @returns {ImageData} 预览效果的图像数据
   */
  preview(imageData, intensity) {
    const originalIntensity = this.intensity;
    this.setIntensity(intensity);
    this.setPreviewMode(true);
    
    const result = this.apply(imageData);
    
    this.setIntensity(originalIntensity);
    this.setPreviewMode(false);
    
    return result;
  }

  /**
   * 获取滤镜描述信息
   * @returns {Object} 描述信息
   */
  getDescription() {
    return {
      name: this.displayName,
      description: '将彩色图像转换为黑白效果，并增强对比度',
      features: [
        '使用加权平均法计算灰度值',
        '智能对比度增强',
        'S曲线优化',
        '支持强度调节 (0-100%)'
      ],
      parameters: {
        intensity: {
          name: '强度',
          range: '0-100%',
          default: 100,
          description: '控制黑白效果的强度'
        },
        contrastBoost: {
          name: '对比度增强',
          range: '1.0-2.0',
          default: 1.2,
          description: '对比度增强系数'
        }
      }
    };
  }
}

module.exports = GrayscaleFilter;
