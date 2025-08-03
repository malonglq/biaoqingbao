// 图层变换工具函数 - 转换自原HTML的变换逻辑

/**
 * 应用变换到图层元素
 * @param {Object} transform - 变换参数 {x, y, scale, rotation, flipX}
 * @returns {String} - CSS transform 字符串
 */
function applyTransform(transform) {
  const { x = 0, y = 0, scale = 1, rotation = 0, flipX = false } = transform;
  const scaleX = flipX ? -scale : scale;
  
  return `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${scaleX}, ${scale}) rotate(${rotation}deg)`;
}

/**
 * 边界约束函数
 * @param {Object} transform - 当前变换状态
 * @param {Object} bounds - 边界限制 {width, height}
 * @returns {Object} - 约束后的变换状态
 */
function constrainToBounds(transform, bounds) {
  const { width = 300, height = 280 } = bounds;
  const maxX = width / 4;
  const maxY = height / 4;
  
  return {
    ...transform,
    x: Math.max(-maxX, Math.min(maxX, transform.x)),
    y: Math.max(-maxY, Math.min(maxY, transform.y))
  };
}

/**
 * 计算两点间距离
 * @param {Object} point1 - 第一个点 {x, y} 或 {clientX, clientY}
 * @param {Object} point2 - 第二个点 {x, y} 或 {clientX, clientY}
 * @returns {Number} - 距离值
 */
function getDistance(point1, point2) {
  // 兼容微信小程序的 touch 对象 (clientX, clientY) 和普通坐标对象 (x, y)
  const x1 = point1.clientX !== undefined ? point1.clientX : point1.x;
  const y1 = point1.clientY !== undefined ? point1.clientY : point1.y;
  const x2 = point2.clientX !== undefined ? point2.clientX : point2.x;
  const y2 = point2.clientY !== undefined ? point2.clientY : point2.y;

  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 计算两点间角度
 * @param {Object} point1 - 第一个点 {x, y} 或 {clientX, clientY}
 * @param {Object} point2 - 第二个点 {x, y} 或 {clientX, clientY}
 * @returns {Number} - 角度值（弧度）
 */
function getAngle(point1, point2) {
  // 兼容微信小程序的 touch 对象 (clientX, clientY) 和普通坐标对象 (x, y)
  const x1 = point1.clientX !== undefined ? point1.clientX : point1.x;
  const y1 = point1.clientY !== undefined ? point1.clientY : point1.y;
  const x2 = point2.clientX !== undefined ? point2.clientX : point2.x;
  const y2 = point2.clientY !== undefined ? point2.clientY : point2.y;

  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.atan2(dy, dx);
}

/**
 * 弧度转角度
 * @param {Number} radian - 弧度值
 * @returns {Number} - 角度值
 */
function radianToDegree(radian) {
  return radian * (180 / Math.PI);
}

/**
 * 计算两个角度之间的最短角度差（处理跨边界问题）
 * @param {Number} angle1 - 起始角度（弧度）
 * @param {Number} angle2 - 结束角度（弧度）
 * @returns {Number} - 角度差（弧度），范围在 -π 到 π 之间
 */
function getAngleDifference(angle1, angle2) {
  let diff = angle2 - angle1;
  // 处理跨边界情况，确保角度差在 -π 到 π 之间
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return diff;
}

/**
 * 角度转弧度
 * @param {Number} degree - 角度值
 * @returns {Number} - 弧度值
 */
function degreeToRadian(degree) {
  return degree * (Math.PI / 180);
}

/**
 * 获取触摸点的中心位置
 * @param {Array} touches - 触摸点数组
 * @returns {Object} - 中心点 {x, y}
 */
function getTouchCenter(touches) {
  if (touches.length === 1) {
    return { x: touches[0].clientX, y: touches[0].clientY };
  }
  
  const x = touches.reduce((sum, touch) => sum + touch.clientX, 0) / touches.length;
  const y = touches.reduce((sum, touch) => sum + touch.clientY, 0) / touches.length;
  return { x, y };
}

/**
 * 限制缩放范围
 * @param {Number} scale - 当前缩放值
 * @param {Number} min - 最小缩放值
 * @param {Number} max - 最大缩放值
 * @returns {Number} - 限制后的缩放值
 */
function constrainScale(scale, min = 0.5, max = 3) {
  return Math.max(min, Math.min(max, scale));
}

/**
 * 限制旋转角度到0-360度范围
 * @param {Number} rotation - 当前旋转角度
 * @returns {Number} - 标准化后的角度
 */
function normalizeRotation(rotation) {
  while (rotation < 0) rotation += 360;
  while (rotation >= 360) rotation -= 360;
  return rotation;
}

/**
 * 创建默认变换状态
 * @returns {Object} - 默认变换状态
 */
function createDefaultTransform() {
  return {
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    flipX: false
  };
}

/**
 * 深拷贝变换状态
 * @param {Object} transform - 原变换状态
 * @returns {Object} - 拷贝后的变换状态
 */
function cloneTransform(transform) {
  return {
    x: transform.x || 0,
    y: transform.y || 0,
    scale: transform.scale || 1,
    rotation: transform.rotation || 0,
    flipX: transform.flipX || false
  };
}

module.exports = {
  applyTransform,
  constrainToBounds,
  getDistance,
  getAngle,
  radianToDegree,
  degreeToRadian,
  getAngleDifference,
  getTouchCenter,
  constrainScale,
  normalizeRotation,
  createDefaultTransform,
  cloneTransform
};
