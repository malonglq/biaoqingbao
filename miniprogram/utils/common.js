// 通用工具函数

/**
 * 根据百分比计算彩虹色谱颜色值
 * @param {Number} percentage - 百分比 (0-100)
 * @returns {String} - RGB颜色值
 */
function calculateColorFromPercentage(percentage) {
  // 彩虹色谱：黑 -> 红 -> 黄 -> 绿 -> 青 -> 蓝 -> 紫 -> 白
  const colors = [
    { r: 0, g: 0, b: 0 },       // 黑色 0%
    { r: 255, g: 0, b: 0 },     // 红色 14.3%
    { r: 255, g: 255, b: 0 },   // 黄色 28.6%
    { r: 0, g: 255, b: 0 },     // 绿色 42.9%
    { r: 0, g: 255, b: 255 },   // 青色 57.1%
    { r: 0, g: 0, b: 255 },     // 蓝色 71.4%
    { r: 255, g: 0, b: 255 },   // 紫色 85.7%
    { r: 255, g: 255, b: 255 }  // 白色 100%
  ];

  const segmentSize = 100 / (colors.length - 1);
  const segmentIndex = Math.floor(percentage / segmentSize);
  const segmentProgress = (percentage % segmentSize) / segmentSize;

  if (segmentIndex >= colors.length - 1) {
    const lastColor = colors[colors.length - 1];
    return `rgb(${lastColor.r}, ${lastColor.g}, ${lastColor.b})`;
  }

  const startColor = colors[segmentIndex];
  const endColor = colors[segmentIndex + 1];

  const r = Math.round(startColor.r + (endColor.r - startColor.r) * segmentProgress);
  const g = Math.round(startColor.g + (endColor.g - startColor.g) * segmentProgress);
  const b = Math.round(startColor.b + (endColor.b - startColor.b) * segmentProgress);

  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * 生成文字描边样式
 * @param {String} strokeColor - 描边颜色
 * @returns {String} - text-shadow CSS值
 */
function generateTextStroke(strokeColor) {
  return [
    `-1px -1px 0 ${strokeColor}`,
    `1px -1px 0 ${strokeColor}`,
    `-1px 1px 0 ${strokeColor}`,
    `1px 1px 0 ${strokeColor}`,
    `-2px 0 0 ${strokeColor}`,
    `2px 0 0 ${strokeColor}`,
    `0 -2px 0 ${strokeColor}`,
    `0 2px 0 ${strokeColor}`
  ].join(', ');
}

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {Number} wait - 等待时间（毫秒）
 * @returns {Function} - 防抖后的函数
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {Number} limit - 时间间隔（毫秒）
 * @returns {Function} - 节流后的函数
 */
function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 深拷贝对象
 * @param {Object} obj - 要拷贝的对象
 * @returns {Object} - 拷贝后的对象
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}

/**
 * 格式化时间
 * @param {Date} date - 日期对象
 * @param {String} format - 格式字符串
 * @returns {String} - 格式化后的时间字符串
 */
function formatTime(date, format = 'YYYY-MM-DD HH:mm:ss') {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 显示提示信息
 * @param {String} title - 提示标题
 * @param {String} icon - 图标类型
 */
function showToast(title, icon = 'none') {
  wx.showToast({
    title,
    icon,
    duration: 2000
  });
}

/**
 * 显示加载提示
 * @param {String} title - 加载提示文字
 */
function showLoading(title = '加载中...') {
  wx.showLoading({
    title,
    mask: true
  });
}

/**
 * 隐藏加载提示
 */
function hideLoading() {
  wx.hideLoading();
}

module.exports = {
  calculateColorFromPercentage,
  generateTextStroke,
  debounce,
  throttle,
  deepClone,
  formatTime,
  showToast,
  showLoading,
  hideLoading
};
