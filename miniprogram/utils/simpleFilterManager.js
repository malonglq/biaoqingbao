// simpleFilterManager.js - 简化版滤镜管理器（专为微信小程序优化）

/**
 * 简化版滤镜管理器
 * 专门为微信小程序环境优化，移除复杂功能，确保稳定性
 */
class SimpleFilterManager {
  constructor() {
    this.currentFilter = null;
    this.originalImageData = null;
    this.isPreviewMode = false;
    this.filterIntensity = 100;
    this.canvasContext = null; // 用于创建ImageData的Canvas上下文

    // 尝试初始化Canvas上下文用于ImageData创建
    this.initCanvasContext();

    console.log('简化版滤镜管理器初始化完成');
  }

  /**
   * 初始化Canvas上下文（用于ImageData创建）
   */
  initCanvasContext() {
    try {
      if (typeof wx !== 'undefined' && wx.createOffscreenCanvas) {
        const canvas = wx.createOffscreenCanvas({ type: '2d' });
        canvas.width = 1;
        canvas.height = 1;
        this.canvasContext = canvas.getContext('2d');
        console.log('Canvas上下文初始化成功');
      }
    } catch (error) {
      console.warn('Canvas上下文初始化失败:', error);
    }
  }

  /**
   * 设置原始图像数据
   * @param {ImageData} imageData - 原始图像数据
   */
  setOriginalImageData(imageData) {
    try {
      if (!imageData || !imageData.data) {
        console.error('无效的图像数据');
        return false;
      }

      // 验证图像数据完整性
      const expectedLength = imageData.width * imageData.height * 4;
      if (imageData.data.length !== expectedLength) {
        console.error('图像数据长度不匹配:', {
          expected: expectedLength,
          actual: imageData.data.length
        });
        return false;
      }

      // 防止重复设置相同的数据
      if (this.originalImageData &&
          this.originalImageData.width === imageData.width &&
          this.originalImageData.height === imageData.height) {
        console.log('原始图像数据已存在，跳过重复设置');
        return true;
      }

      this.originalImageData = imageData;
      console.log('原始图像数据已设置:', imageData.width + 'x' + imageData.height);
      return true;
    } catch (error) {
      console.error('设置原始图像数据失败:', error);
      return false;
    }
  }

  /**
   * 激活滤镜
   * @param {string} filterType - 滤镜类型 ('grayscale' 或 'opacity')
   * @returns {boolean} 是否成功激活
   */
  activateFilter(filterType) {
    try {
      if (filterType === 'grayscale' || filterType === 'opacity') {
        this.currentFilter = filterType;
        this.filterIntensity = 100;
        console.log(`${filterType}滤镜已激活`);
        return true;
      } else {
        console.error('不支持的滤镜类型:', filterType);
        return false;
      }
    } catch (error) {
      console.error('激活滤镜失败:', error);
      return false;
    }
  }

  /**
   * 激活黑白滤镜（保持向后兼容）
   * @returns {boolean} 是否成功激活
   */
  activateGrayscaleFilter() {
    return this.activateFilter('grayscale');
  }

  /**
   * 激活透明化滤镜
   * @returns {boolean} 是否成功激活
   */
  activateOpacityFilter() {
    return this.activateFilter('opacity');
  }

  /**
   * 取消激活滤镜
   */
  deactivateFilter() {
    this.currentFilter = null;
    this.isPreviewMode = false;
    this.filterIntensity = 100;
    console.log('滤镜已取消激活');
  }

  /**
   * 设置滤镜强度
   * @param {number} intensity - 强度值 (0-100)
   */
  setFilterIntensity(intensity) {
    this.filterIntensity = Math.max(0, Math.min(100, intensity));
  }

  /**
   * 获取滤镜强度
   * @returns {number} 强度值
   */
  getFilterIntensity() {
    return this.filterIntensity;
  }

  /**
   * 预览滤镜效果
   * @param {number} intensity - 预览强度
   * @returns {ImageData|null} 预览图像数据
   */
  previewFilter(intensity) {
    try {
      console.log('🎯 previewFilter 开始执行:', {
        intensity,
        currentFilter: this.currentFilter,
        hasOriginalImageData: !!this.originalImageData,
        originalImageDataSize: this.originalImageData ? `${this.originalImageData.width}x${this.originalImageData.height}` : 'null'
      });

      if (!this.originalImageData) {
        console.error('❌ 没有原始图像数据');
        return null;
      }

      if (!this.currentFilter) {
        console.error('❌ 没有激活的滤镜');
        return null;
      }

      this.isPreviewMode = true;

      console.log(`🔄 准备应用 ${this.currentFilter} 滤镜，强度: ${intensity}%`);

      if (this.currentFilter === 'grayscale') {
        console.log('📞 调用 applyGrayscaleFilter');
        const result = this.applyGrayscaleFilter(this.originalImageData, intensity);
        console.log('✅ applyGrayscaleFilter 返回结果:', !!result);
        return result;
      } else if (this.currentFilter === 'opacity') {
        console.log('📞 调用 applyOpacityFilter');
        const result = this.applyOpacityFilter(this.originalImageData, intensity);
        console.log('✅ applyOpacityFilter 返回结果:', !!result);
        return result;
      }

      console.warn('⚠️ 未知的滤镜类型:', this.currentFilter);
      return null;
    } catch (error) {
      console.error('❌ 预览滤镜失败:', error);
      return null;
    }
  }

  /**
   * 应用黑白滤镜预览（保持向后兼容）
   * @param {number} intensity - 预览强度
   * @returns {ImageData|null} 预览图像数据
   */
  previewGrayscaleFilter(intensity) {
    this.currentFilter = 'grayscale';
    return this.previewFilter(intensity);
  }

  /**
   * 应用透明化滤镜预览
   * @param {number} intensity - 预览强度
   * @returns {ImageData|null} 预览图像数据
   */
  previewOpacityFilter(intensity) {
    this.currentFilter = 'opacity';
    return this.previewFilter(intensity);
  }

  /**
   * 应用黑白滤镜
   * @param {ImageData} imageData - 图像数据
   * @param {number} intensity - 强度 (0-100)
   * @returns {ImageData|null} 处理后的图像数据
   */
  applyGrayscaleFilter(imageData, intensity) {
    try {
      console.log('🎨 applyGrayscaleFilter 开始执行:', {
        intensity,
        hasImageData: !!imageData,
        imageDataSize: imageData ? `${imageData.width}x${imageData.height}` : 'null',
        dataLength: imageData?.data?.length || 0
      });

      if (!imageData || !imageData.data) {
        console.error('❌ 无效的图像数据');
        return null;
      }

      console.log(`🎯 应用黑白滤镜，强度: ${intensity}%`);

      // 如果强度为0，直接返回原图
      if (intensity === 0) {
        console.log('⚪ 强度为0，返回原图');
        return this.cloneImageData(imageData);
      }

      // 克隆图像数据
      console.log('📋 开始克隆图像数据...');
      const result = this.cloneImageData(imageData);
      if (!result) {
        console.error('❌ 克隆图像数据失败');
        return null;
      }
      console.log('✅ 图像数据克隆成功');

      const data = result.data;
      const factor = intensity / 100;
      let pixelsChanged = 0;

      // 记录处理前的第一个像素值
      const originalFirstPixel = {
        r: data[0],
        g: data[1],
        b: data[2],
        a: data[3]
      };
      console.log('📊 处理前第一个像素:', originalFirstPixel);

      // 应用黑白滤镜
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // 使用加权平均法计算灰度值
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

        // 根据强度混合原色和灰度
        const newR = Math.round(r + (gray - r) * factor);
        const newG = Math.round(g + (gray - g) * factor);
        const newB = Math.round(b + (gray - b) * factor);

        data[i] = newR;     // R
        data[i + 1] = newG; // G
        data[i + 2] = newB; // B
        // data[i + 3] 保持不变 (Alpha通道)

        // 统计变化的像素
        if (newR !== r || newG !== g || newB !== b) {
          pixelsChanged++;
        }
      }

      // 记录处理后的第一个像素值
      const processedFirstPixel = {
        r: data[0],
        g: data[1],
        b: data[2],
        a: data[3]
      };

      console.log('✅ 黑白滤镜处理完成:', {
        intensity: `${intensity}%`,
        factor: factor,
        pixelsChanged: pixelsChanged,
        totalPixels: data.length / 4,
        originalFirstPixel: originalFirstPixel,
        processedFirstPixel: processedFirstPixel,
        pixelChangeDetected: pixelsChanged > 0,
        pixelChangeRate: `${((pixelsChanged / (data.length / 4)) * 100).toFixed(1)}%`
      });

      return result;
    } catch (error) {
      console.error('❌ 应用黑白滤镜失败:', error);
      return null;
    }
  }

  /**
   * 应用透明化滤镜
   * @param {ImageData} imageData - 图像数据
   * @param {number} intensity - 强度 (0-100)，0=完全透明，100=完全不透明
   * @returns {ImageData|null} 处理后的图像数据
   */
  applyOpacityFilter(imageData, intensity) {
    try {
      console.log('🎨 applyOpacityFilter 开始执行:', {
        intensity,
        hasImageData: !!imageData,
        imageDataSize: imageData ? `${imageData.width}x${imageData.height}` : 'null',
        dataLength: imageData?.data?.length || 0
      });

      if (!imageData || !imageData.data) {
        console.error('❌ 无效的图像数据');
        return null;
      }

      console.log(`🎯 应用透明化滤镜，强度: ${intensity}%`);

      // 克隆图像数据
      console.log('📋 开始克隆图像数据...');
      const result = this.cloneImageData(imageData);
      if (!result) {
        console.error('❌ 克隆图像数据失败');
        return null;
      }
      console.log('✅ 图像数据克隆成功');

      const data = result.data;
      const alpha = intensity / 100;
      let alphaChannelsChanged = 0;

      // 记录处理前的第一个像素的Alpha值
      const originalFirstAlpha = data[3];
      console.log('📊 处理前第一个像素Alpha值:', originalFirstAlpha);

      // 应用透明度滤镜
      for (let i = 3; i < data.length; i += 4) {
        const originalAlpha = data[i];
        const newAlpha = Math.round(originalAlpha * alpha);

        // 只修改Alpha通道
        data[i] = newAlpha;

        // 统计变化的Alpha通道
        if (newAlpha !== originalAlpha) {
          alphaChannelsChanged++;
        }
      }

      // 记录处理后的第一个像素的Alpha值
      const processedFirstAlpha = data[3];

      console.log('✅ 透明化滤镜处理完成:', {
        intensity: `${intensity}%`,
        alphaFactor: alpha,
        alphaChannelsChanged: alphaChannelsChanged,
        totalPixels: data.length / 4,
        originalFirstAlpha: originalFirstAlpha,
        processedFirstAlpha: processedFirstAlpha,
        alphaChangeDetected: alphaChannelsChanged > 0,
        alphaChangeRate: `${((alphaChannelsChanged / (data.length / 4)) * 100).toFixed(1)}%`
      });

      return result;
    } catch (error) {
      console.error('❌ 应用透明化滤镜失败:', error);
      return null;
    }
  }

  /**
   * 应用当前激活的滤镜
   * @param {number} intensity - 强度 (0-100)
   * @returns {ImageData|null} 处理后的图像数据
   */
  applyCurrentFilter(intensity) {
    try {
      if (!this.originalImageData || !this.currentFilter) {
        console.error('没有原始图像数据或未激活滤镜');
        return null;
      }

      if (this.currentFilter === 'grayscale') {
        return this.applyGrayscaleFilter(this.originalImageData, intensity);
      } else if (this.currentFilter === 'opacity') {
        return this.applyOpacityFilter(this.originalImageData, intensity);
      }

      return null;
    } catch (error) {
      console.error('应用当前滤镜失败:', error);
      return null;
    }
  }

  /**
   * 克隆图像数据（微信小程序兼容版）
   * @param {ImageData} imageData - 原始图像数据
   * @returns {ImageData|null} 克隆的图像数据
   */
  cloneImageData(imageData) {
    try {
      if (!imageData || !imageData.data) {
        console.error('无效的图像数据');
        return null;
      }

      // 克隆像素数据
      const clonedData = new Uint8ClampedArray(imageData.data);

      // 在微信小程序环境中，尝试创建真正的ImageData对象
      if (typeof wx !== 'undefined') {
        try {
          // 方法1：使用预初始化的Canvas上下文
          if (this.canvasContext && this.canvasContext.createImageData) {
            const newImageData = this.canvasContext.createImageData(imageData.width, imageData.height);
            newImageData.data.set(clonedData);
            console.log('使用预初始化Canvas上下文创建ImageData成功');
            return newImageData;
          }

          // 方法2：尝试使用全局的createImageData（如果存在）
          if (typeof createImageData === 'function') {
            const newImageData = createImageData(imageData.width, imageData.height);
            newImageData.data.set(clonedData);
            console.log('使用全局createImageData创建成功');
            return newImageData;
          }

          // 方法3：创建新的Canvas上下文
          const canvas = wx.createOffscreenCanvas({ type: '2d' });
          canvas.width = imageData.width;
          canvas.height = imageData.height;
          const ctx = canvas.getContext('2d');

          if (ctx && ctx.createImageData) {
            const newImageData = ctx.createImageData(imageData.width, imageData.height);
            newImageData.data.set(clonedData);
            console.log('使用新Canvas上下文创建ImageData成功');
            return newImageData;
          }
        } catch (wxError) {
          console.warn('微信小程序ImageData创建失败，使用备用方案:', wxError);
        }
      }

      // 方法3：浏览器环境或备用方案
      if (typeof ImageData !== 'undefined') {
        try {
          return new ImageData(clonedData, imageData.width, imageData.height);
        } catch (browserError) {
          console.warn('浏览器ImageData创建失败:', browserError);
        }
      }

      // 最后的备用方案：返回兼容的对象结构
      console.warn('使用备用ImageData结构');
      const backupImageData = {
        data: clonedData,
        width: imageData.width,
        height: imageData.height
      };

      // 尝试添加ImageData的原型方法（如果可能）
      if (typeof ImageData !== 'undefined' && ImageData.prototype) {
        Object.setPrototypeOf(backupImageData, ImageData.prototype);
      }

      return backupImageData;
    } catch (error) {
      console.error('克隆图像数据失败:', error);
      return null;
    }
  }

  /**
   * 退出预览模式
   */
  exitPreviewMode() {
    this.isPreviewMode = false;
  }

  /**
   * 获取当前状态
   * @returns {Object} 状态信息
   */
  getStatus() {
    return {
      hasOriginalImage: !!this.originalImageData,
      isPreviewMode: this.isPreviewMode,
      currentFilter: this.currentFilter,
      filterIntensity: this.filterIntensity
    };
  }

  /**
   * 清理资源
   */
  cleanup() {
    this.originalImageData = null;
    this.currentFilter = null;
    this.isPreviewMode = false;
    this.filterIntensity = 100;
    console.log('简化版滤镜管理器资源已清理');
  }
}

module.exports = SimpleFilterManager;
