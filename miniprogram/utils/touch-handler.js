// 触摸交互处理工具 - 转换自原HTML的触摸逻辑

/**
 * 触摸事件处理器类
 */
class TouchHandler {
  constructor() {
    this.touchState = {
      isDragging: false,
      isScaling: false,
      activeLayer: null,
      startTouches: [],
      lastTouches: [],
      initialDistance: 0,
      initialAngle: 0,
      initialTransform: null
    };
    
    this.callbacks = {
      onTransformUpdate: null,
      onTouchStart: null,
      onTouchMove: null,
      onTouchEnd: null
    };
  }

  /**
   * 设置回调函数
   * @param {Object} callbacks - 回调函数对象
   */
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * 处理触摸开始事件
   * @param {Object} e - 触摸事件对象
   * @param {String} layerType - 图层类型
   * @param {Object} currentTransform - 当前变换状态
   */
  handleTouchStart(e, layerType, currentTransform) {
    const touches = e.touches;
    
    if (!layerType || touches.length === 0) return;
    
    this.touchState = {
      isDragging: touches.length === 1,
      isScaling: touches.length === 2,
      activeLayer: layerType,
      startTouches: this.copyTouches(touches),
      lastTouches: this.copyTouches(touches),
      initialDistance: touches.length === 2 ? this.getDistance(touches[0], touches[1]) : 0,
      initialAngle: touches.length === 2 ? this.getAngle(touches[0], touches[1]) : 0,
      initialTransform: { ...currentTransform }
    };
    
    if (this.callbacks.onTouchStart) {
      this.callbacks.onTouchStart(this.touchState);
    }
  }

  /**
   * 处理触摸移动事件
   * @param {Object} e - 触摸事件对象
   * @param {Object} currentTransform - 当前变换状态
   * @returns {Object|null} - 新的变换状态或null
   */
  handleTouchMove(e, currentTransform) {
    const touches = e.touches;
    
    if (!this.touchState.activeLayer || touches.length === 0) return null;
    
    let newTransform = { ...currentTransform };
    
    if (this.touchState.isDragging && touches.length === 1) {
      // 单指拖拽
      newTransform = this.handleDrag(touches, newTransform);
    } else if (this.touchState.isScaling && touches.length === 2) {
      // 双指缩放和旋转
      newTransform = this.handleScaleAndRotate(touches, newTransform);
    }
    
    // 更新最后触摸点
    this.touchState.lastTouches = this.copyTouches(touches);
    
    if (this.callbacks.onTouchMove) {
      this.callbacks.onTouchMove(newTransform);
    }
    
    return newTransform;
  }

  /**
   * 处理触摸结束事件
   * @param {Object} e - 触摸事件对象
   */
  handleTouchEnd(e) {
    this.touchState.isDragging = false;
    this.touchState.isScaling = false;
    this.touchState.activeLayer = null;
    
    if (this.callbacks.onTouchEnd) {
      this.callbacks.onTouchEnd();
    }
  }

  /**
   * 处理拖拽
   * @param {Array} touches - 触摸点数组
   * @param {Object} transform - 当前变换状态
   * @returns {Object} - 新的变换状态
   */
  handleDrag(touches, transform) {
    const deltaX = touches[0].clientX - this.touchState.lastTouches[0].clientX;
    const deltaY = touches[0].clientY - this.touchState.lastTouches[0].clientY;
    
    return {
      ...transform,
      x: transform.x + deltaX,
      y: transform.y + deltaY
    };
  }

  /**
   * 处理缩放和旋转
   * @param {Array} touches - 触摸点数组
   * @param {Object} transform - 当前变换状态
   * @returns {Object} - 新的变换状态
   */
  handleScaleAndRotate(touches, transform) {
    const currentDistance = this.getDistance(touches[0], touches[1]);
    const currentAngle = this.getAngle(touches[0], touches[1]);
    
    // 计算缩放比例
    const scaleRatio = currentDistance / this.touchState.initialDistance;
    const newScale = this.constrainScale(this.touchState.initialTransform.scale * scaleRatio);
    
    // 计算旋转角度
    const angleDelta = this.radianToDegree(currentAngle - this.touchState.initialAngle);
    const newRotation = this.normalizeRotation(this.touchState.initialTransform.rotation + angleDelta);
    
    return {
      ...transform,
      scale: newScale,
      rotation: newRotation
    };
  }

  /**
   * 处理点击翻转
   * @param {Object} transform - 当前变换状态
   * @returns {Object} - 新的变换状态
   */
  handleFlip(transform) {
    return {
      ...transform,
      flipX: !transform.flipX
    };
  }

  /**
   * 复制触摸点数组
   * @param {Array} touches - 原触摸点数组
   * @returns {Array} - 复制的触摸点数组
   */
  copyTouches(touches) {
    return Array.from(touches).map(touch => ({
      clientX: touch.clientX,
      clientY: touch.clientY,
      identifier: touch.identifier
    }));
  }

  /**
   * 计算两点间距离
   * @param {Object} point1 - 第一个点
   * @param {Object} point2 - 第二个点
   * @returns {Number} - 距离值
   */
  getDistance(point1, point2) {
    const dx = point2.clientX - point1.clientX;
    const dy = point2.clientY - point1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 计算两点间角度
   * @param {Object} point1 - 第一个点
   * @param {Object} point2 - 第二个点
   * @returns {Number} - 角度值（弧度）
   */
  getAngle(point1, point2) {
    const dx = point2.clientX - point1.clientX;
    const dy = point2.clientY - point1.clientY;
    return Math.atan2(dy, dx);
  }

  /**
   * 弧度转角度
   * @param {Number} radian - 弧度值
   * @returns {Number} - 角度值
   */
  radianToDegree(radian) {
    return radian * (180 / Math.PI);
  }

  /**
   * 限制缩放范围
   * @param {Number} scale - 当前缩放值
   * @param {Number} min - 最小缩放值
   * @param {Number} max - 最大缩放值
   * @returns {Number} - 限制后的缩放值
   */
  constrainScale(scale, min = 0.5, max = 3) {
    return Math.max(min, Math.min(max, scale));
  }

  /**
   * 标准化旋转角度
   * @param {Number} rotation - 当前旋转角度
   * @returns {Number} - 标准化后的角度
   */
  normalizeRotation(rotation) {
    while (rotation < 0) rotation += 360;
    while (rotation >= 360) rotation -= 360;
    return rotation;
  }

  /**
   * 获取当前触摸状态
   * @returns {Object} - 触摸状态对象
   */
  getTouchState() {
    return { ...this.touchState };
  }

  /**
   * 重置触摸状态
   */
  reset() {
    this.touchState = {
      isDragging: false,
      isScaling: false,
      activeLayer: null,
      startTouches: [],
      lastTouches: [],
      initialDistance: 0,
      initialAngle: 0,
      initialTransform: null
    };
  }
}

module.exports = TouchHandler;
