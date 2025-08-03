// canvasUtils.js - Canvas操作工具函数

/**
 * 获取Canvas实例的通用方法
 * @param {Object} component - 组件实例
 * @param {String} selector - Canvas选择器
 * @returns {Promise<Canvas>} - Canvas实例
 */
function getCanvasInstance(component, selector) {
  return new Promise((resolve, reject) => {
    const query = component.createSelectorQuery();
    query.select(selector)
      .fields({ node: true, size: true })
      .exec((res) => {
        if (res[0] && res[0].node) {
          resolve(res[0].node);
        } else {
          reject(new Error(`Canvas获取失败: ${selector}`));
        }
      });
  });
}

/**
 * 设置Canvas的高DPI支持
 * @param {Canvas} canvas - Canvas实例
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {Number} width - 逻辑宽度
 * @param {Number} height - 逻辑高度
 */
function setupHighDPI(canvas, ctx, width, height) {
  const dpr = wx.getSystemInfoSync().pixelRatio || 1;
  
  // 设置Canvas实际尺寸
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  
  // 缩放上下文以匹配设备像素比
  ctx.scale(dpr, dpr);
  
  // 设置图像平滑
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  return dpr;
}

/**
 * 在Canvas上绘制图片并自适应尺寸
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {Image} image - 图片对象
 * @param {Number} canvasWidth - Canvas宽度
 * @param {Number} canvasHeight - Canvas高度
 * @param {String} mode - 适应模式 ('contain', 'cover', 'fill')
 * @returns {Object} - 绘制信息 {x, y, width, height, scale}
 */
function drawImageWithFit(ctx, image, canvasWidth, canvasHeight, mode = 'contain') {
  const imageAspect = image.width / image.height;
  const canvasAspect = canvasWidth / canvasHeight;
  
  let drawWidth, drawHeight, drawX, drawY, scale;
  
  switch (mode) {
    case 'cover':
      if (imageAspect > canvasAspect) {
        drawHeight = canvasHeight;
        drawWidth = drawHeight * imageAspect;
        scale = drawHeight / image.height;
      } else {
        drawWidth = canvasWidth;
        drawHeight = drawWidth / imageAspect;
        scale = drawWidth / image.width;
      }
      drawX = (canvasWidth - drawWidth) / 2;
      drawY = (canvasHeight - drawHeight) / 2;
      break;
      
    case 'fill':
      drawWidth = canvasWidth;
      drawHeight = canvasHeight;
      drawX = 0;
      drawY = 0;
      scale = Math.max(canvasWidth / image.width, canvasHeight / image.height);
      break;
      
    default: // contain
      if (imageAspect > canvasAspect) {
        drawWidth = canvasWidth;
        drawHeight = drawWidth / imageAspect;
        scale = drawWidth / image.width;
      } else {
        drawHeight = canvasHeight;
        drawWidth = drawHeight * imageAspect;
        scale = drawHeight / image.height;
      }
      drawX = (canvasWidth - drawWidth) / 2;
      drawY = (canvasHeight - drawHeight) / 2;
      break;
  }
  
  // 清空Canvas
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  
  // 绘制图片
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  
  return {
    x: drawX,
    y: drawY,
    width: drawWidth,
    height: drawHeight,
    scale
  };
}

/**
 * 将Canvas坐标转换为图片坐标
 * @param {Number} canvasX - Canvas X坐标
 * @param {Number} canvasY - Canvas Y坐标
 * @param {Object} drawInfo - 绘制信息
 * @returns {Object} - 图片坐标 {x, y}
 */
function canvasToImageCoords(canvasX, canvasY, drawInfo) {
  const { x, y, scale } = drawInfo;
  
  return {
    x: (canvasX - x) / scale,
    y: (canvasY - y) / scale
  };
}

/**
 * 将图片坐标转换为Canvas坐标
 * @param {Number} imageX - 图片X坐标
 * @param {Number} imageY - 图片Y坐标
 * @param {Object} drawInfo - 绘制信息
 * @returns {Object} - Canvas坐标 {x, y}
 */
function imageToCanvasCoords(imageX, imageY, drawInfo) {
  const { x, y, scale } = drawInfo;
  
  return {
    x: imageX * scale + x,
    y: imageY * scale + y
  };
}

/**
 * 检查点是否在图片区域内
 * @param {Number} x - X坐标
 * @param {Number} y - Y坐标
 * @param {Object} drawInfo - 绘制信息
 * @returns {Boolean} - 是否在图片区域内
 */
function isPointInImage(x, y, drawInfo) {
  const { x: imgX, y: imgY, width, height } = drawInfo;
  
  return x >= imgX && x <= imgX + width && y >= imgY && y <= imgY + height;
}

/**
 * 创建圆形笔刷路径
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {Number} x - 中心X坐标
 * @param {Number} y - 中心Y坐标
 * @param {Number} radius - 半径
 */
function createCircleBrush(ctx, x, y, radius) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
}

/**
 * 创建方形笔刷路径
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {Number} x - 中心X坐标
 * @param {Number} y - 中心Y坐标
 * @param {Number} size - 尺寸
 */
function createSquareBrush(ctx, x, y, size) {
  const halfSize = size / 2;
  ctx.beginPath();
  ctx.rect(x - halfSize, y - halfSize, size, size);
}

/**
 * 绘制平滑线条
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {Array} points - 点数组 [{x, y}, ...]
 * @param {Number} lineWidth - 线宽
 * @param {String} strokeStyle - 线条样式
 */
function drawSmoothLine(ctx, points, lineWidth = 1, strokeStyle = '#000000') {
  if (points.length < 2) return;
  
  ctx.save();
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = strokeStyle;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  
  if (points.length === 2) {
    ctx.lineTo(points[1].x, points[1].y);
  } else {
    for (let i = 1; i < points.length - 1; i++) {
      const currentPoint = points[i];
      const nextPoint = points[i + 1];
      const controlX = (currentPoint.x + nextPoint.x) / 2;
      const controlY = (currentPoint.y + nextPoint.y) / 2;
      
      ctx.quadraticCurveTo(currentPoint.x, currentPoint.y, controlX, controlY);
    }
    
    // 绘制最后一段
    const lastPoint = points[points.length - 1];
    const secondLastPoint = points[points.length - 2];
    ctx.quadraticCurveTo(secondLastPoint.x, secondLastPoint.y, lastPoint.x, lastPoint.y);
  }
  
  ctx.stroke();
  ctx.restore();
}

/**
 * 应用Canvas滤镜
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {String} filter - 滤镜字符串
 */
function applyCanvasFilter(ctx, filter) {
  if (ctx.filter !== undefined) {
    ctx.filter = filter;
  }
}

/**
 * 重置Canvas滤镜
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 */
function resetCanvasFilter(ctx) {
  if (ctx.filter !== undefined) {
    ctx.filter = 'none';
  }
}

/**
 * 获取Canvas的ImageData
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {Number} x - X坐标
 * @param {Number} y - Y坐标
 * @param {Number} width - 宽度
 * @param {Number} height - 高度
 * @returns {ImageData} - 图像数据
 */
function getCanvasImageData(ctx, x = 0, y = 0, width, height) {
  const canvas = ctx.canvas;
  const w = width || canvas.width;
  const h = height || canvas.height;
  
  return ctx.getImageData(x, y, w, h);
}

/**
 * 设置Canvas的ImageData
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {ImageData} imageData - 图像数据
 * @param {Number} x - X坐标
 * @param {Number} y - Y坐标
 */
function setCanvasImageData(ctx, imageData, x = 0, y = 0) {
  ctx.putImageData(imageData, x, y);
}

/**
 * 清空Canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {Number} x - X坐标
 * @param {Number} y - Y坐标
 * @param {Number} width - 宽度
 * @param {Number} height - 高度
 */
function clearCanvas(ctx, x = 0, y = 0, width, height) {
  const canvas = ctx.canvas;
  const w = width || canvas.width;
  const h = height || canvas.height;
  
  ctx.clearRect(x, y, w, h);
}

/**
 * 保存Canvas为临时文件
 * @param {Canvas} canvas - Canvas实例
 * @param {Object} options - 选项
 * @returns {Promise<String>} - 临时文件路径
 */
function saveCanvasToTempFile(canvas, options = {}) {
  return new Promise((resolve, reject) => {
    wx.canvasToTempFilePath({
      canvas,
      fileType: options.fileType || 'png',
      quality: options.quality || 1,
      success: (res) => resolve(res.tempFilePath),
      fail: reject,
      ...options
    });
  });
}

/**
 * 计算两点间距离
 * @param {Object} point1 - 点1 {x, y}
 * @param {Object} point2 - 点2 {x, y}
 * @returns {Number} - 距离
 */
function getDistance(point1, point2) {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 计算两点间角度
 * @param {Object} point1 - 点1 {x, y}
 * @param {Object} point2 - 点2 {x, y}
 * @returns {Number} - 角度（弧度）
 */
function getAngle(point1, point2) {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.atan2(dy, dx);
}

module.exports = {
  getCanvasInstance,
  setupHighDPI,
  drawImageWithFit,
  canvasToImageCoords,
  imageToCanvasCoords,
  isPointInImage,
  createCircleBrush,
  createSquareBrush,
  drawSmoothLine,
  applyCanvasFilter,
  resetCanvasFilter,
  getCanvasImageData,
  setCanvasImageData,
  clearCanvas,
  saveCanvasToTempFile,
  getDistance,
  getAngle
};
