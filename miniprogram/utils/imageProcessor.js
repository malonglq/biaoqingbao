// imageProcessor.js - 图片处理工具函数

/**
 * 应用黑白滤镜
 * @param {ImageData} imageData - 原始图像数据
 * @returns {ImageData} - 处理后的图像数据
 */
function applyGrayscaleFilter(imageData) {
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // 使用加权平均法计算灰度值
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    
    data[i] = gray;     // R
    data[i + 1] = gray; // G
    data[i + 2] = gray; // B
    // data[i + 3] 保持不变 (Alpha通道)
  }
  
  return imageData;
}

/**
 * 应用透明度滤镜
 * @param {ImageData} imageData - 原始图像数据
 * @param {Number} opacity - 透明度 (0-100)
 * @returns {ImageData} - 处理后的图像数据
 */
function applyOpacityFilter(imageData, opacity) {
  const data = imageData.data;
  const alpha = opacity / 100;
  
  for (let i = 3; i < data.length; i += 4) {
    data[i] = Math.round(data[i] * alpha);
  }
  
  return imageData;
}

/**
 * 应用亮度调整
 * @param {ImageData} imageData - 原始图像数据
 * @param {Number} brightness - 亮度调整值 (-100 到 100)
 * @returns {ImageData} - 处理后的图像数据
 */
function applyBrightnessFilter(imageData, brightness) {
  const data = imageData.data;
  const adjustment = brightness * 2.55; // 转换为0-255范围
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, Math.min(255, data[i] + adjustment));     // R
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + adjustment)); // G
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + adjustment)); // B
  }
  
  return imageData;
}

/**
 * 应用对比度调整
 * @param {ImageData} imageData - 原始图像数据
 * @param {Number} contrast - 对比度调整值 (-100 到 100)
 * @returns {ImageData} - 处理后的图像数据
 */
function applyContrastFilter(imageData, contrast) {
  const data = imageData.data;
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));     // R
    data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128)); // G
    data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128)); // B
  }
  
  return imageData;
}

/**
 * 应用饱和度调整
 * @param {ImageData} imageData - 原始图像数据
 * @param {Number} saturation - 饱和度调整值 (-100 到 100)
 * @returns {ImageData} - 处理后的图像数据
 */
function applySaturationFilter(imageData, saturation) {
  const data = imageData.data;
  const factor = (saturation + 100) / 100;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // 计算灰度值
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    
    // 应用饱和度调整
    data[i] = Math.max(0, Math.min(255, gray + factor * (r - gray)));
    data[i + 1] = Math.max(0, Math.min(255, gray + factor * (g - gray)));
    data[i + 2] = Math.max(0, Math.min(255, gray + factor * (b - gray)));
  }
  
  return imageData;
}

/**
 * 应用模糊效果
 * @param {ImageData} imageData - 原始图像数据
 * @param {Number} radius - 模糊半径
 * @returns {ImageData} - 处理后的图像数据
 */
function applyBlurFilter(imageData, radius = 1) {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const output = new Uint8ClampedArray(data);
  
  const kernelSize = radius * 2 + 1;
  const kernel = [];
  let kernelSum = 0;
  
  // 生成高斯核
  for (let i = 0; i < kernelSize; i++) {
    const x = i - radius;
    const value = Math.exp(-(x * x) / (2 * radius * radius));
    kernel[i] = value;
    kernelSum += value;
  }
  
  // 归一化核
  for (let i = 0; i < kernelSize; i++) {
    kernel[i] /= kernelSum;
  }
  
  // 水平模糊
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      
      for (let i = 0; i < kernelSize; i++) {
        const px = Math.max(0, Math.min(width - 1, x + i - radius));
        const idx = (y * width + px) * 4;
        const weight = kernel[i];
        
        r += data[idx] * weight;
        g += data[idx + 1] * weight;
        b += data[idx + 2] * weight;
        a += data[idx + 3] * weight;
      }
      
      const idx = (y * width + x) * 4;
      output[idx] = r;
      output[idx + 1] = g;
      output[idx + 2] = b;
      output[idx + 3] = a;
    }
  }
  
  // 垂直模糊
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let r = 0, g = 0, b = 0, a = 0;
      
      for (let i = 0; i < kernelSize; i++) {
        const py = Math.max(0, Math.min(height - 1, y + i - radius));
        const idx = (py * width + x) * 4;
        const weight = kernel[i];
        
        r += output[idx] * weight;
        g += output[idx + 1] * weight;
        b += output[idx + 2] * weight;
        a += output[idx + 3] * weight;
      }
      
      const idx = (y * width + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = a;
    }
  }
  
  return imageData;
}

/**
 * 复制ImageData
 * @param {ImageData} imageData - 原始图像数据
 * @returns {ImageData} - 复制的图像数据
 */
function cloneImageData(imageData) {
  if (!imageData) return null;

  try {
    const clonedData = new Uint8ClampedArray(imageData.data);

    // 在微信小程序环境中，需要通过Canvas上下文创建ImageData
    if (typeof ImageData === 'undefined') {
      // 创建临时离屏Canvas来生成ImageData
      const canvas = wx.createOffscreenCanvas({ type: '2d' });
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const ctx = canvas.getContext('2d');

      // 使用createImageData方法创建ImageData对象
      const newImageData = ctx.createImageData(imageData.width, imageData.height);
      newImageData.data.set(clonedData);
      return newImageData;
    } else {
      // 浏览器环境，直接使用ImageData构造函数
      return new ImageData(clonedData, imageData.width, imageData.height);
    }
  } catch (error) {
    console.error('复制ImageData失败:', error);
    return null;
  }
}

/**
 * 创建空白ImageData
 * @param {Number} width - 宽度
 * @param {Number} height - 高度
 * @param {String} fillColor - 填充颜色 (可选)
 * @returns {ImageData} - 新的图像数据
 */
function createImageData(width, height, fillColor = 'transparent') {
  const canvas = wx.createOffscreenCanvas({ type: '2d' });
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (fillColor !== 'transparent') {
    ctx.fillStyle = fillColor;
    ctx.fillRect(0, 0, width, height);
  }
  
  return ctx.getImageData(0, 0, width, height);
}

/**
 * 合并多个ImageData
 * @param {Array} imageDatas - ImageData数组
 * @param {String} blendMode - 混合模式
 * @returns {ImageData} - 合并后的图像数据
 */
function mergeImageData(imageDatas, blendMode = 'normal') {
  if (!imageDatas || imageDatas.length === 0) return null;
  
  const base = cloneImageData(imageDatas[0]);
  
  for (let i = 1; i < imageDatas.length; i++) {
    const overlay = imageDatas[i];
    blendImageData(base, overlay, blendMode);
  }
  
  return base;
}

/**
 * 混合两个ImageData
 * @param {ImageData} base - 基础图像数据
 * @param {ImageData} overlay - 覆盖图像数据
 * @param {String} blendMode - 混合模式
 */
function blendImageData(base, overlay, blendMode = 'normal') {
  const baseData = base.data;
  const overlayData = overlay.data;
  
  for (let i = 0; i < baseData.length; i += 4) {
    const alpha = overlayData[i + 3] / 255;
    
    if (alpha > 0) {
      switch (blendMode) {
        case 'multiply':
          baseData[i] = (baseData[i] * overlayData[i]) / 255;
          baseData[i + 1] = (baseData[i + 1] * overlayData[i + 1]) / 255;
          baseData[i + 2] = (baseData[i + 2] * overlayData[i + 2]) / 255;
          break;
        case 'screen':
          baseData[i] = 255 - ((255 - baseData[i]) * (255 - overlayData[i])) / 255;
          baseData[i + 1] = 255 - ((255 - baseData[i + 1]) * (255 - overlayData[i + 1])) / 255;
          baseData[i + 2] = 255 - ((255 - baseData[i + 2]) * (255 - overlayData[i + 2])) / 255;
          break;
        case 'overlay':
          baseData[i] = baseData[i] < 128 ? 
            (2 * baseData[i] * overlayData[i]) / 255 : 
            255 - (2 * (255 - baseData[i]) * (255 - overlayData[i])) / 255;
          baseData[i + 1] = baseData[i + 1] < 128 ? 
            (2 * baseData[i + 1] * overlayData[i + 1]) / 255 : 
            255 - (2 * (255 - baseData[i + 1]) * (255 - overlayData[i + 1])) / 255;
          baseData[i + 2] = baseData[i + 2] < 128 ? 
            (2 * baseData[i + 2] * overlayData[i + 2]) / 255 : 
            255 - (2 * (255 - baseData[i + 2]) * (255 - overlayData[i + 2])) / 255;
          break;
        default: // normal
          baseData[i] = overlayData[i] * alpha + baseData[i] * (1 - alpha);
          baseData[i + 1] = overlayData[i + 1] * alpha + baseData[i + 1] * (1 - alpha);
          baseData[i + 2] = overlayData[i + 2] * alpha + baseData[i + 2] * (1 - alpha);
          break;
      }
      
      baseData[i + 3] = Math.min(255, baseData[i + 3] + overlayData[i + 3] * alpha);
    }
  }
}

module.exports = {
  applyGrayscaleFilter,
  applyOpacityFilter,
  applyBrightnessFilter,
  applyContrastFilter,
  applySaturationFilter,
  applyBlurFilter,
  cloneImageData,
  createImageData,
  mergeImageData,
  blendImageData
};
