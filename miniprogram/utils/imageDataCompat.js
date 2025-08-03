// imageDataCompat.js - ImageData兼容性工具
// 解决微信小程序环境中ImageData构造函数不可用的问题

/**
 * 创建ImageData对象（兼容微信小程序）
 * @param {Uint8ClampedArray|number} dataOrWidth - 图像数据数组或宽度
 * @param {number} width - 宽度（当第一个参数是数据数组时）
 * @param {number} height - 高度
 * @returns {ImageData} - ImageData对象
 */
function createImageData(dataOrWidth, width, height) {
  try {
    // 判断参数类型
    let imageWidth, imageHeight, imageData;
    
    if (typeof dataOrWidth === 'number') {
      // createImageData(width, height)
      imageWidth = dataOrWidth;
      imageHeight = width;
      imageData = null;
    } else {
      // createImageData(data, width, height)
      imageData = dataOrWidth;
      imageWidth = width;
      imageHeight = height;
    }
    
    // 在微信小程序环境中，需要通过Canvas上下文创建ImageData
    if (typeof ImageData === 'undefined') {
      // 创建临时离屏Canvas来生成ImageData
      const canvas = wx.createOffscreenCanvas({ type: '2d' });
      canvas.width = imageWidth;
      canvas.height = imageHeight;
      const ctx = canvas.getContext('2d');
      
      // 使用createImageData方法创建ImageData对象
      const newImageData = ctx.createImageData(imageWidth, imageHeight);
      
      // 如果提供了数据，则设置数据
      if (imageData) {
        newImageData.data.set(imageData);
      }
      
      return newImageData;
    } else {
      // 浏览器环境，直接使用ImageData构造函数
      if (imageData) {
        return new ImageData(imageData, imageWidth, imageHeight);
      } else {
        return new ImageData(imageWidth, imageHeight);
      }
    }
  } catch (error) {
    console.error('创建ImageData失败:', error);
    return null;
  }
}

/**
 * 克隆ImageData对象（兼容微信小程序）
 * @param {ImageData} imageData - 原始图像数据
 * @returns {ImageData} - 克隆的图像数据
 */
function cloneImageData(imageData) {
  if (!imageData) return null;
  
  try {
    const clonedData = new Uint8ClampedArray(imageData.data);
    return createImageData(clonedData, imageData.width, imageData.height);
  } catch (error) {
    console.error('克隆ImageData失败:', error);
    return null;
  }
}

/**
 * 检查当前环境是否支持ImageData构造函数
 * @returns {boolean} - 是否支持ImageData构造函数
 */
function isImageDataSupported() {
  return typeof ImageData !== 'undefined';
}

/**
 * 获取环境信息
 * @returns {Object} - 环境信息
 */
function getEnvironmentInfo() {
  return {
    isWechatMiniProgram: typeof wx !== 'undefined',
    isImageDataSupported: isImageDataSupported(),
    platform: typeof wx !== 'undefined' ? 'wechat-miniprogram' : 'browser'
  };
}

/**
 * 安全地创建空白ImageData
 * @param {number} width - 宽度
 * @param {number} height - 高度
 * @param {string} fillColor - 填充颜色 (可选，默认透明)
 * @returns {ImageData} - 新的图像数据
 */
function createBlankImageData(width, height, fillColor = 'transparent') {
  try {
    if (typeof wx !== 'undefined') {
      // 微信小程序环境
      const canvas = wx.createOffscreenCanvas({ type: '2d' });
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (fillColor !== 'transparent') {
        ctx.fillStyle = fillColor;
        ctx.fillRect(0, 0, width, height);
      }
      
      return ctx.getImageData(0, 0, width, height);
    } else {
      // 浏览器环境
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (fillColor !== 'transparent') {
        ctx.fillStyle = fillColor;
        ctx.fillRect(0, 0, width, height);
      }
      
      return ctx.getImageData(0, 0, width, height);
    }
  } catch (error) {
    console.error('创建空白ImageData失败:', error);
    return null;
  }
}

/**
 * 验证ImageData对象的有效性
 * @param {ImageData} imageData - 要验证的ImageData对象
 * @returns {boolean} - 是否有效
 */
function validateImageData(imageData) {
  return imageData && 
         imageData.data && 
         typeof imageData.width === 'number' && 
         typeof imageData.height === 'number' &&
         imageData.width > 0 && 
         imageData.height > 0 &&
         imageData.data.length === imageData.width * imageData.height * 4;
}

module.exports = {
  createImageData,
  cloneImageData,
  isImageDataSupported,
  getEnvironmentInfo,
  createBlankImageData,
  validateImageData
};
