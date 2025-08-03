// editHistory.js - 编辑历史管理工具
const { cloneImageData, validateImageData } = require('./imageDataCompat');

/**
 * 创建编辑历史管理器
 * @param {Number} maxHistorySize - 最大历史记录数量
 * @returns {Object} - 历史管理器实例
 */
function createEditHistory(maxHistorySize = 20) {
  let history = [];
  let currentIndex = -1;
  let hasInitialState = false;
  
  return {
    /**
     * 添加新的历史记录
     * @param {ImageData} imageData - 图像数据
     */
    push(imageData) {
      // 验证ImageData的有效性
      if (!validateImageData(imageData)) {
        console.error('无效的ImageData，无法添加到历史记录');
        return;
      }

      // 如果当前不在历史记录的末尾，删除后续的记录
      if (currentIndex < history.length - 1) {
        history = history.slice(0, currentIndex + 1);
      }

      // 克隆ImageData以避免引用问题
      const clonedData = cloneImageData(imageData);
      if (!clonedData) {
        console.error('克隆ImageData失败，无法添加到历史记录');
        return;
      }

      history.push(clonedData);

      // 限制历史记录数量
      if (history.length > maxHistorySize) {
        history.shift();
      } else {
        currentIndex++;
      }

      if (!hasInitialState) {
        hasInitialState = true;
      }
    },
    
    /**
     * 撤销操作
     * @returns {ImageData|null} - 撤销后的图像数据
     */
    undo() {
      if (!this.canUndo()) {
        return null;
      }

      currentIndex--;
      const imageData = this._cloneImageData(history[currentIndex]);
      return imageData;
    },

    /**
     * 重做操作
     * @returns {ImageData|null} - 重做后的图像数据
     */
    redo() {
      if (!this.canRedo()) {
        return null;
      }

      currentIndex++;
      const imageData = this._cloneImageData(history[currentIndex]);
      return imageData;
    },
    
    /**
     * 检查是否可以撤销
     * @returns {Boolean} - 是否可以撤销
     */
    canUndo() {
      return currentIndex > 0;
    },
    
    /**
     * 检查是否可以重做
     * @returns {Boolean} - 是否可以重做
     */
    canRedo() {
      return currentIndex < history.length - 1;
    },
    
    /**
     * 检查是否有变更
     * @returns {Boolean} - 是否有变更
     */
    hasChanges() {
      return hasInitialState && currentIndex > 0;
    },
    
    /**
     * 获取当前状态
     * @returns {ImageData|null} - 当前图像数据
     */
    getCurrentState() {
      if (currentIndex >= 0 && currentIndex < history.length) {
        return this._cloneImageData(history[currentIndex]);
      }
      return null;
    },
    
    /**
     * 获取初始状态
     * @returns {ImageData|null} - 初始图像数据
     */
    getInitialState() {
      if (history.length > 0) {
        return this._cloneImageData(history[0]);
      }
      return null;
    },
    
    /**
     * 重置到初始状态
     * @returns {ImageData|null} - 初始图像数据
     */
    resetToInitial() {
      if (history.length > 0) {
        currentIndex = 0;
        console.log('重置到初始状态');
        return this._cloneImageData(history[0]);
      }
      return null;
    },
    
    /**
     * 清空历史记录
     */
    clear() {
      history = [];
      currentIndex = -1;
      hasInitialState = false;
    },
    
    /**
     * 获取历史记录信息
     * @returns {Object} - 历史记录信息
     */
    getInfo() {
      return {
        totalCount: history.length,
        currentIndex,
        canUndo: this.canUndo(),
        canRedo: this.canRedo(),
        hasChanges: this.hasChanges(),
        hasInitialState
      };
    },
    
    /**
     * 设置最大历史记录数量
     * @param {Number} size - 最大数量
     */
    setMaxSize(size) {
      maxHistorySize = Math.max(1, size);
      
      // 如果当前历史记录超过新的限制，删除最旧的记录
      while (history.length > maxHistorySize) {
        history.shift();
        if (currentIndex > 0) {
          currentIndex--;
        }
      }
    },
    
    /**
     * 获取指定索引的历史记录
     * @param {Number} index - 索引
     * @returns {ImageData|null} - 图像数据
     */
    getStateAt(index) {
      if (index >= 0 && index < history.length) {
        return this._cloneImageData(history[index]);
      }
      return null;
    },
    
    /**
     * 跳转到指定的历史记录
     * @param {Number} index - 目标索引
     * @returns {ImageData|null} - 图像数据
     */
    jumpTo(index) {
      if (index >= 0 && index < history.length) {
        currentIndex = index;
        return this._cloneImageData(history[index]);
      }
      return null;
    },
    
    /**
     * 克隆ImageData
     * @private
     * @param {ImageData} imageData - 原始图像数据
     * @returns {ImageData} - 克隆的图像数据
     */
    _cloneImageData(imageData) {
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
        console.error('克隆ImageData失败:', error);
        return null;
      }
    }
  };
}

/**
 * 创建简化版历史管理器（仅支持撤销/重做）
 * @param {Number} maxHistorySize - 最大历史记录数量
 * @returns {Object} - 简化历史管理器实例
 */
function createSimpleHistory(maxHistorySize = 10) {
  const states = [];
  let currentIndex = -1;
  
  return {
    save(state) {
      // 删除当前位置之后的所有状态
      states.splice(currentIndex + 1);
      
      // 添加新状态
      states.push(state);
      currentIndex = states.length - 1;
      
      // 限制历史记录数量
      if (states.length > maxHistorySize) {
        states.shift();
        currentIndex--;
      }
    },
    
    undo() {
      if (currentIndex > 0) {
        currentIndex--;
        return states[currentIndex];
      }
      return null;
    },
    
    redo() {
      if (currentIndex < states.length - 1) {
        currentIndex++;
        return states[currentIndex];
      }
      return null;
    },
    
    canUndo() {
      return currentIndex > 0;
    },
    
    canRedo() {
      return currentIndex < states.length - 1;
    },
    
    clear() {
      states.length = 0;
      currentIndex = -1;
    },
    
    getCurrentState() {
      return currentIndex >= 0 ? states[currentIndex] : null;
    }
  };
}

/**
 * 创建操作历史管理器（记录操作而非状态）
 * @param {Number} maxHistorySize - 最大历史记录数量
 * @returns {Object} - 操作历史管理器实例
 */
function createOperationHistory(maxHistorySize = 50) {
  const operations = [];
  let currentIndex = -1;
  
  return {
    /**
     * 记录操作
     * @param {Object} operation - 操作对象
     */
    recordOperation(operation) {
      // 删除当前位置之后的所有操作
      operations.splice(currentIndex + 1);
      
      // 添加新操作
      operations.push({
        ...operation,
        timestamp: Date.now(),
        id: this._generateId()
      });
      
      currentIndex = operations.length - 1;
      
      // 限制历史记录数量
      if (operations.length > maxHistorySize) {
        operations.shift();
        currentIndex--;
      }
    },
    
    /**
     * 获取撤销操作
     * @returns {Object|null} - 撤销操作
     */
    getUndoOperation() {
      if (currentIndex >= 0) {
        const operation = operations[currentIndex];
        currentIndex--;
        return operation;
      }
      return null;
    },
    
    /**
     * 获取重做操作
     * @returns {Object|null} - 重做操作
     */
    getRedoOperation() {
      if (currentIndex < operations.length - 1) {
        currentIndex++;
        return operations[currentIndex];
      }
      return null;
    },
    
    canUndo() {
      return currentIndex >= 0;
    },
    
    canRedo() {
      return currentIndex < operations.length - 1;
    },
    
    clear() {
      operations.length = 0;
      currentIndex = -1;
    },
    
    getOperations() {
      return [...operations];
    },
    
    _generateId() {
      return Math.random().toString(36).substr(2, 9);
    }
  };
}

module.exports = {
  createEditHistory,
  createSimpleHistory,
  createOperationHistory
};
