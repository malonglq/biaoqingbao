// canvas-editor.js
const { createEditHistory } = require('../../utils/editHistory.js');
const { applyGrayscaleFilter, applyOpacityFilter } = require('../../utils/imageProcessor.js');

Component({
  properties: {
    imageSrc: {
      type: String,
      value: ''
    },
    canvasWidth: {
      type: Number,
      value: 300
    },
    canvasHeight: {
      type: Number,
      value: 300
    },
    currentTool: {
      type: String,
      value: ''
    },
    toolConfig: {
      type: Object,
      value: {}
    }
  },

  data: {
    isLoading: false,
    loadingText: '加载中...',
    
    // Canvas相关
    mainCanvas: null,
    mainCtx: null,
    offscreenCanvas: null,
    offscreenCtx: null,
    canvasInitFailed: false,
    
    // 图片相关
    originalImage: null,
    currentImageData: null,
    imageScale: 1,
    imageOffsetX: 0,
    imageOffsetY: 0,
    
    // 绘制状态
    isDrawing: false,
    lastPoint: null,
    
    // 工具状态
    brushSize: 20,
    brushColor: '#FF6B6B',
    currentOpacity: 100,

    // 滤镜处理状态管理
    isProcessingFilter: false,
    filterProcessingType: null,

    // 实时调整标志
    isRealtimeOpacity: false,

    // 滤镜管理器初始化标志
    filterManagerInitialized: false
  },

  lifetimes: {
    attached() {
      this.editHistory = createEditHistory();
      // 延迟初始化Canvas，确保DOM已渲染
      setTimeout(() => {
        this.initCanvas();
      }, 100);
    },

    ready() {
      // 组件布局完成后再次尝试初始化
      if (!this.data.mainCanvas) {
        setTimeout(() => {
          this.initCanvas();
        }, 200);
      }
    },

    detached() {
      this.cleanup();
    }
  },

  observers: {
    'imageSrc': function(newSrc) {
      if (newSrc) {
        this.loadImage(newSrc);
      }
    },
    
    'canvasWidth, canvasHeight': function(width, height) {
      if (width && height && this.data.mainCanvas) {
        this.resizeCanvas(width, height);
      }
    }
  },

  methods: {
    // 初始化Canvas
    async initCanvas() {
      try {
        this.setData({ isLoading: true, loadingText: '初始化画布...' });

        // 等待更长时间确保DOM完全渲染
        await new Promise(resolve => setTimeout(resolve, 800));

        // 先尝试简单的Canvas获取
        const mainCanvas = await this.getCanvasSimple('#mainCanvas');

        const mainCtx = mainCanvas.getContext('2d');
        if (!mainCtx) {
          throw new Error('无法获取Canvas 2D上下文');
        }

        // 获取离屏Canvas
        const offscreenCanvas = await this.getCanvasSimple('#offscreenCanvas');
        const offscreenCtx = offscreenCanvas.getContext('2d');

        // 设置图像平滑
        mainCtx.imageSmoothingEnabled = true;
        offscreenCtx.imageSmoothingEnabled = true;

        this.setData({
          mainCanvas,
          mainCtx,
          offscreenCanvas,
          offscreenCtx,
          canvasInitFailed: false
        });

        this.triggerEvent('canvasReady');

        // 如果有图片源，立即加载
        if (this.properties.imageSrc) {
          this.loadImage(this.properties.imageSrc);
        }

      } catch (error) {
        console.error('Canvas初始化失败:', error);
        // Canvas初始化失败时，使用图片预览模式
        this.setData({
          loadingText: 'Canvas初始化失败，使用预览模式',
          isLoading: false,
          canvasInitFailed: true
        });

        // 触发事件通知父组件Canvas不可用
        this.triggerEvent('canvasInitFailed', { error: error.message });
      }
    },

    // 获取Canvas实例
    getCanvas(selector) {
      return new Promise((resolve, reject) => {
        // 多次尝试获取Canvas节点
        let attempts = 0;
        const maxAttempts = 5;

        const tryGetCanvas = () => {
          attempts++;

          const query = this.createSelectorQuery();
          query.select(selector)
            .fields({ node: true, size: true })
            .exec((res) => {
              if (res && res[0] && res[0].node) {
                resolve(res[0].node);
              } else if (attempts < maxAttempts) {
                setTimeout(tryGetCanvas, 500);
              } else {
                console.error('Canvas获取失败，已达到最大重试次数:', selector);
                reject(new Error(`Canvas获取失败: ${selector}`));
              }
            });
        };

        tryGetCanvas();
      });
    },

    // 简化的Canvas获取方法
    getCanvasSimple(selector) {
      return new Promise((resolve, reject) => {
        const query = this.createSelectorQuery();
        query.select(selector)
          .fields({ node: true, size: true })
          .exec((res) => {
            if (res && res.length > 0 && res[0] && res[0].node) {
              resolve(res[0].node);
            } else {
              console.error('Canvas获取失败:', selector);
              reject(new Error(`Canvas获取失败: ${selector}`));
            }
          });
      });
    },

    // 加载图片
    async loadImage(imageSrc) {
      try {
        this.setData({ isLoading: true, loadingText: '加载图片...' });

        // 确保Canvas已初始化
        if (!this.data.mainCanvas) {
          await this.waitForCanvas();
        }

        const image = this.data.mainCanvas.createImage();

        await new Promise((resolve, reject) => {
          image.onload = () => {
            resolve();
          };
          image.onerror = (error) => {
            console.error('图片加载失败:', error);
            reject(error);
          };
          image.src = imageSrc;
        });

        this.setData({ originalImage: image });

        // 设置Canvas尺寸（使用官方标准方法）
        this.setupCanvasForImage(image);

        this.triggerEvent('imageLoaded', {
          width: image.width,
          height: image.height
        });

      } catch (error) {
        console.error('图片加载失败:', error);
        this.setData({
          loadingText: '图片加载失败',
          isLoading: false
        });
      }
    },

    // 等待Canvas初始化
    waitForCanvas(maxWait = 5000) {
      return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const checkCanvas = () => {
          if (this.data.mainCanvas) {
            resolve();
          } else if (Date.now() - startTime > maxWait) {
            reject(new Error('Canvas初始化超时'));
          } else {
            setTimeout(checkCanvas, 100);
          }
        };
        checkCanvas();
      });
    },

    // 设置Canvas尺寸（按照微信官方文档标准方法）
    setupCanvasForImage(image) {
      const { mainCanvas, mainCtx, offscreenCanvas, offscreenCtx } = this.data;

      if (!mainCanvas || !offscreenCanvas) {
        console.error('Canvas未初始化，无法设置尺寸');
        return false;
      }

      try {
        // 获取设备像素比
        const dpr = wx.getSystemInfoSync().pixelRatio;
        console.log('🔧 设备像素比:', dpr);

        // 获取Canvas的CSS显示尺寸
        const query = this.createSelectorQuery();
        query.select('#mainCanvas')
          .fields({ size: true })
          .exec((res) => {
            if (res && res[0]) {
              const { width: cssWidth, height: cssHeight } = res[0];

              console.log('🎯 Canvas CSS尺寸:', { cssWidth, cssHeight });

              // 限制Canvas最大尺寸，避免内存溢出
              // 微信小程序Canvas 2D最大支持1365x1365
              const maxCanvasSize = 600; // 保守设置最大尺寸

              let canvasWidth = cssWidth * dpr;
              let canvasHeight = cssHeight * dpr;

              // 如果尺寸过大，按比例缩小
              if (canvasWidth > maxCanvasSize || canvasHeight > maxCanvasSize) {
                const scale = Math.min(maxCanvasSize / canvasWidth, maxCanvasSize / canvasHeight);
                canvasWidth = Math.floor(canvasWidth * scale);
                canvasHeight = Math.floor(canvasHeight * scale);
                console.log('⚠️ Canvas尺寸过大，已缩小:', { scale, newSize: `${canvasWidth}x${canvasHeight}` });
              }

              // 设置Canvas内部尺寸
              mainCanvas.width = canvasWidth;
              mainCanvas.height = canvasHeight;
              offscreenCanvas.width = canvasWidth;
              offscreenCanvas.height = canvasHeight;

              // 计算实际的缩放比例
              const actualScaleX = canvasWidth / cssWidth;
              const actualScaleY = canvasHeight / cssHeight;

              // 缩放绘制坐标系
              mainCtx.scale(actualScaleX, actualScaleY);
              offscreenCtx.scale(actualScaleX, actualScaleY);

              // 设置图像平滑
              mainCtx.imageSmoothingEnabled = true;
              offscreenCtx.imageSmoothingEnabled = true;

              console.log('✅ Canvas尺寸设置完成:', {
                cssSize: `${cssWidth}x${cssHeight}`,
                canvasSize: `${canvasWidth}x${canvasHeight}`,
                dpr: dpr,
                actualScale: `${actualScaleX.toFixed(2)}x${actualScaleY.toFixed(2)}`
              });

              // 更新组件数据
              this.setData({
                canvasWidth: canvasWidth,
                canvasHeight: canvasHeight,
                cssWidth: cssWidth,
                cssHeight: cssHeight,
                dpr: dpr,
                actualScaleX: actualScaleX,
                actualScaleY: actualScaleY
              });

              // 重新计算图片布局和绘制
              this.calculateImageLayout(image);
              this.drawImage();
              this.saveToHistory();

              // 初始化滤镜管理器
              setTimeout(() => {
                this.initFilterManagerImageData();
              }, 100);
            }
          });

        return true;
      } catch (error) {
        console.error('Canvas尺寸设置失败:', error);
        return false;
      }
    },

    // 计算图片布局（完全模拟首页image组件的aspectFill效果）
    calculateImageLayout(image) {
      const { cssWidth, cssHeight } = this.data;

      // 使用CSS尺寸进行布局计算，因为绘制坐标系已经通过scale()调整

      // 完全模拟微信小程序image组件mode="aspectFill"的行为
      // aspectFill: 保持纵横比缩放图片，只保证图片的短边能完全显示出来
      const scaleX = cssWidth / image.width;
      const scaleY = cssHeight / image.height;
      const scale = Math.max(scaleX, scaleY); // 使用较大的缩放比例确保填充整个容器

      // 计算缩放后的图片尺寸
      const scaledWidth = image.width * scale;
      const scaledHeight = image.height * scale;

      // 计算居中偏移，确保图片在Canvas中居中显示
      // 这与image组件的aspectFill行为完全一致
      const offsetX = (cssWidth - scaledWidth) / 2;
      const offsetY = (cssHeight - scaledHeight) / 2;

      this.setData({
        imageScale: scale,
        imageOffsetX: offsetX,
        imageOffsetY: offsetY
      });
    },

    // 绘制图片
    drawImage() {
      const { mainCtx, originalImage, imageScale, imageOffsetX, imageOffsetY, canvasWidth, canvasHeight } = this.data;
      
      if (!mainCtx || !originalImage) return;
      
      // 清空画布
      mainCtx.clearRect(0, 0, canvasWidth, canvasHeight);
      
      // 绘制图片
      mainCtx.drawImage(
        originalImage,
        imageOffsetX,
        imageOffsetY,
        originalImage.width * imageScale,
        originalImage.height * imageScale
      );
    },

    // 安全的getImageData方法，避免内存溢出
    safeGetImageData(ctx, x, y, width, height) {
      // 检查尺寸是否过大
      const maxPixels = 4096 * 4096; // 16M像素限制
      const totalPixels = width * height;

      if (totalPixels > maxPixels) {
        console.warn('图像数据尺寸过大，跳过获取:', {
          size: `${width}x${height}`,
          pixels: totalPixels
        });
        return null;
      }

      try {
        return ctx.getImageData(x, y, width, height);
      } catch (error) {
        console.error('获取图像数据失败:', error);
        return null;
      }
    },

    // 保存到历史记录
    saveToHistory() {
      const { mainCtx, canvasWidth, canvasHeight } = this.data;
      if (!mainCtx) return;

      const imageData = this.safeGetImageData(mainCtx, 0, 0, canvasWidth, canvasHeight);
      if (imageData) {
        this.editHistory.push(imageData);
        this.updateHistoryState();
      }
    },

    // 更新历史记录状态
    updateHistoryState() {
      this.triggerEvent('operationComplete', {
        canUndo: this.editHistory.canUndo(),
        canRedo: this.editHistory.canRedo(),
        hasChanges: this.editHistory.hasChanges()
      });
    },

    // 设置工具
    setTool(tool, config) {
      this.setData({
        currentTool: tool,
        brushSize: config.brushSize || 20,
        brushColor: config.brushColor || '#FF6B6B',
        currentOpacity: config.opacity || 100,
        currentGrayscaleIntensity: config.grayscaleIntensity || 100
      });
    },

    // 设置实时模式
    setRealtimeMode(isRealtime) {
      this.setData({ isRealtimeOpacity: isRealtime });
    },

    // 应用透明度
    applyOpacity(opacity) {
      if (!this.data.originalImage) return;

      // 防止重复处理
      if (this.data.isProcessingFilter && this.data.filterProcessingType === 'opacity') {
        return;
      }

      // 对于实时调整，不显示加载状态
      const isRealtime = this.data.isRealtimeOpacity;

      // 设置处理状态
      this.setData({
        isProcessingFilter: true,
        filterProcessingType: 'opacity'
      });

      if (!isRealtime) {
        this.setData({ isLoading: true, loadingText: '应用透明度...' });
      }

      // 使用requestAnimationFrame确保渲染时序
      const processFilter = () => {
        try {
          const { mainCtx, offscreenCtx, originalImage, imageScale, imageOffsetX, imageOffsetY, canvasWidth, canvasHeight } = this.data;

          // 在离屏Canvas上绘制原图
          offscreenCtx.clearRect(0, 0, canvasWidth, canvasHeight);
          offscreenCtx.drawImage(
            originalImage,
            imageOffsetX,
            imageOffsetY,
            originalImage.width * imageScale,
            originalImage.height * imageScale
          );

          // 获取整个Canvas的图像数据
          const imageData = this.safeGetImageData(offscreenCtx, 0, 0, canvasWidth, canvasHeight);
          if (!imageData) {
            console.error('无法获取图像数据，跳过透明度滤镜处理');
            return;
          }

          const filteredData = this.applyOpacityFilter(imageData, opacity);

          // 在主Canvas上显示处理后的图像
          mainCtx.clearRect(0, 0, canvasWidth, canvasHeight);
          mainCtx.putImageData(filteredData, 0, 0);

          // 强制Canvas刷新
          this.forceCanvasRefresh(mainCtx);

          // 保存到历史记录（仅在非实时模式下）
          if (!isRealtime) {
            this.saveToHistory();
          }

          // 清除处理状态
          this.setData({
            isProcessingFilter: false,
            filterProcessingType: null
          });

          if (!isRealtime) {
            this.setData({ isLoading: false });
          }
        } catch (error) {
          console.error('透明度滤镜处理失败:', error);
          // 清除处理状态
          this.setData({
            isProcessingFilter: false,
            filterProcessingType: null,
            isLoading: false
          });
        }
      };

      if (this.data.mainCanvas && this.data.mainCanvas.requestAnimationFrame) {
        this.data.mainCanvas.requestAnimationFrame(processFilter);
      } else {
        // 回退方案：使用微小延迟确保渲染队列清空
        setTimeout(processFilter, 16);
      }
    },

    // 应用透明度滤镜（内部方法）
    applyOpacityFilter(imageData, opacity) {
      const data = imageData.data;
      const alpha = opacity / 100;

      for (let i = 3; i < data.length; i += 4) {
        data[i] = Math.round(data[i] * alpha);
      }

      return imageData;
    },

    // 应用黑白滤镜
    applyGrayscale() {
      this.applyGrayscaleWithIntensity(100);
    },

    // 应用带强度的黑白滤镜
    applyGrayscaleWithIntensity(intensity) {
      if (!this.data.originalImage) return;

      // 防止重复处理
      if (this.data.isProcessingFilter && this.data.filterProcessingType === 'grayscale') {
        return;
      }

      // 设置处理状态
      this.setData({
        isProcessingFilter: true,
        filterProcessingType: 'grayscale',
        isLoading: true,
        loadingText: '应用黑白滤镜...'
      });

      // 使用requestAnimationFrame确保渲染时序
      const processFilter = () => {
        try {
          const { mainCtx, offscreenCtx, originalImage, imageScale, imageOffsetX, imageOffsetY, canvasWidth, canvasHeight } = this.data;

          // 在离屏Canvas上绘制原图
          offscreenCtx.clearRect(0, 0, canvasWidth, canvasHeight);
          offscreenCtx.drawImage(
            originalImage,
            imageOffsetX,
            imageOffsetY,
            originalImage.width * imageScale,
            originalImage.height * imageScale
          );

          // 获取整个Canvas的图像数据
          const imageData = this.safeGetImageData(offscreenCtx, 0, 0, canvasWidth, canvasHeight);
          if (!imageData) {
            console.error('无法获取图像数据，跳过黑白滤镜处理');
            return;
          }

          const filteredData = this.applyGrayscaleFilterWithIntensity(imageData, intensity);

          // 在主Canvas上显示处理后的图像
          mainCtx.clearRect(0, 0, canvasWidth, canvasHeight);
          mainCtx.putImageData(filteredData, 0, 0);

          // 强制Canvas刷新
          this.forceCanvasRefresh(mainCtx);

          // 保存到历史记录
          this.saveToHistory();

          // 清除处理状态
          this.setData({
            isProcessingFilter: false,
            filterProcessingType: null,
            isLoading: false
          });
        } catch (error) {
          console.error('黑白滤镜处理失败:', error);
          // 清除处理状态
          this.setData({
            isProcessingFilter: false,
            filterProcessingType: null,
            isLoading: false
          });
        }
      };

      if (this.data.mainCanvas && this.data.mainCanvas.requestAnimationFrame) {
        this.data.mainCanvas.requestAnimationFrame(processFilter);
      } else {
        // 回退方案：使用微小延迟确保渲染队列清空
        setTimeout(processFilter, 16);
      }
    },

    // 应用带强度的黑白滤镜（内部方法）
    applyGrayscaleFilterWithIntensity(imageData, intensity) {
      const data = imageData.data;
      const factor = intensity / 100;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // 使用加权平均法计算灰度值
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

        // 根据强度混合原色和灰度
        data[i] = Math.round(r + (gray - r) * factor);     // R
        data[i + 1] = Math.round(g + (gray - g) * factor); // G
        data[i + 2] = Math.round(b + (gray - b) * factor); // B
        // data[i + 3] 保持不变 (Alpha通道)
      }

      return imageData;
    },

    // 设置笔刷大小
    setBrushSize(size) {
      this.setData({ brushSize: size });
    },

    // 设置笔刷颜色
    setBrushColor(color) {
      this.setData({ brushColor: color });
    },

    // 强制Canvas刷新（优化版）
    forceCanvasRefreshOptimized(ctx) {
      try {
        console.log('🔄 开始优化版Canvas刷新');

        // 防抖处理：避免频繁刷新
        if (this.refreshDebounceTimer) {
          clearTimeout(this.refreshDebounceTimer);
        }

        this.refreshDebounceTimer = setTimeout(() => {
          // 方法1：使用Canvas的内置刷新机制
          if (ctx && typeof ctx.draw === 'function') {
            ctx.draw(true);
            console.log('✅ 使用ctx.draw刷新');
          }

          // 方法2：微信小程序Canvas刷新
          if (this.data.mainCanvas && typeof this.data.mainCanvas.requestAnimationFrame === 'function') {
            this.data.mainCanvas.requestAnimationFrame(() => {
              console.log('✅ 使用requestAnimationFrame刷新');
            });
          }

          // 方法3：触发组件刷新事件
          this.triggerEvent('canvasRefresh');
          console.log('✅ 触发组件刷新事件');

        }, 16); // 一帧的时间防抖

      } catch (error) {
        console.warn('⚠️ Canvas刷新失败:', error);
      }
    },

    // 强制Canvas刷新（增强版 - 保留原版本作为备用）
    forceCanvasRefresh(ctx) {
      try {
        console.log('🔄 开始强制Canvas刷新');

        // 方法1：使用Canvas的内置刷新机制
        if (ctx && typeof ctx.draw === 'function') {
          ctx.draw(true);
          console.log('✅ 使用ctx.draw刷新');
        }

        // 方法2：微信小程序特有的Canvas刷新
        if (this.data.mainCanvas) {
          const canvas = this.data.mainCanvas;

          // 尝试调用Canvas的刷新方法
          if (typeof canvas.requestAnimationFrame === 'function') {
            canvas.requestAnimationFrame(() => {
              console.log('✅ 使用requestAnimationFrame刷新');
            });
          }

          // 触发重绘事件
          if (canvas.style) {
            // 临时修改样式触发重绘
            const originalTransform = canvas.style.transform;
            canvas.style.transform = 'translateZ(0)';
            setTimeout(() => {
              canvas.style.transform = originalTransform;
              console.log('✅ 使用样式变换刷新');
            }, 0);
          }
        }

        // 方法3：强制重绘整个组件
        setTimeout(() => {
          this.triggerEvent('canvasRefresh');
          console.log('✅ 触发组件刷新事件');
        }, 16); // 一帧的时间

        // 方法4：使用微信小程序的Canvas API强制刷新
        if (typeof wx !== 'undefined' && wx.canvasToTempFilePath) {
          // 这个调用会强制Canvas进行一次渲染
          setTimeout(() => {
            try {
              wx.canvasToTempFilePath({
                canvas: this.data.mainCanvas,
                success: () => {
                  console.log('✅ Canvas强制渲染完成');
                },
                fail: () => {
                  // 忽略失败，这只是为了触发渲染
                }
              });
            } catch (e) {
              // 忽略错误
            }
          }, 32);
        }

      } catch (error) {
        console.warn('⚠️ Canvas刷新失败:', error);
      }
    },

    // 触摸开始
    onTouchStart(e) {
      const { currentTool } = this.data;

      if (currentTool === 'brush' || currentTool === 'eraser') {
        this.startDrawing(e);
      }
      // 注意：黑白和透明度工具现在通过滑块控制，不在触摸时直接应用
    },

    // 触摸移动
    onTouchMove(e) {
      if (this.data.isDrawing) {
        this.continueDrawing(e);
      }
    },

    // 触摸结束
    onTouchEnd(e) {
      if (this.data.isDrawing) {
        this.endDrawing();
      }
    },

    // 开始绘制
    startDrawing(e) {
      const touch = e.touches[0];

      // 获取Canvas的位置信息
      const query = this.createSelectorQuery();
      query.select('.main-canvas').boundingClientRect((rect) => {
        if (rect) {
          const x = touch.clientX - rect.left;
          const y = touch.clientY - rect.top;

          this.setData({
            isDrawing: true,
            lastPoint: { x, y }
          });
        }
      }).exec();
    },

    // 继续绘制
    continueDrawing(e) {
      const { mainCtx, currentTool, brushSize, brushColor, lastPoint } = this.data;
      if (!mainCtx || !lastPoint) return;

      const touch = e.touches[0];

      // 获取Canvas的位置信息
      const query = this.createSelectorQuery();
      query.select('.main-canvas').boundingClientRect((rect) => {
        if (rect) {
          const x = touch.clientX - rect.left;
          const y = touch.clientY - rect.top;

          mainCtx.beginPath();
          mainCtx.moveTo(lastPoint.x, lastPoint.y);
          mainCtx.lineTo(x, y);

          if (currentTool === 'brush') {
            mainCtx.globalCompositeOperation = 'source-over';
            mainCtx.strokeStyle = brushColor;
          } else if (currentTool === 'eraser') {
            mainCtx.globalCompositeOperation = 'destination-out';
          }

          mainCtx.lineWidth = brushSize;
          mainCtx.lineCap = 'round';
          mainCtx.lineJoin = 'round';
          mainCtx.stroke();

          this.setData({ lastPoint: { x, y } });
        }
      }).exec();
    },

    // 结束绘制
    endDrawing() {
      this.setData({
        isDrawing: false,
        lastPoint: null
      });
      
      // 恢复合成模式
      if (this.data.mainCtx) {
        this.data.mainCtx.globalCompositeOperation = 'source-over';
      }
      
      this.saveToHistory();
    },

    // 撤销
    undo() {
      const imageData = this.editHistory.undo();
      if (imageData && this.data.mainCtx) {
        this.data.mainCtx.putImageData(imageData, 0, 0);
        this.updateHistoryState();
      }
    },

    // 重做
    redo() {
      const imageData = this.editHistory.redo();
      if (imageData && this.data.mainCtx) {
        this.data.mainCtx.putImageData(imageData, 0, 0);
        this.updateHistoryState();
      }
    },

    // 重置
    reset() {
      this.editHistory.clear();
      this.drawImage();
      this.saveToHistory();
    },

    // 导出图片
    exportImage() {
      return new Promise((resolve, reject) => {
        if (!this.data.mainCanvas) {
          reject(new Error('Canvas未准备就绪'));
          return;
        }
        
        wx.canvasToTempFilePath({
          canvas: this.data.mainCanvas,
          success: (res) => resolve(res.tempFilePath),
          fail: reject
        });
      });
    },

    // 调整Canvas尺寸
    resizeCanvas(width, height) {
      // 重新初始化Canvas
      this.initCanvas();
    },

    // 图片加载成功（预览模式）
    onImageLoad(e) {
      this.triggerEvent('imageLoaded', {
        width: e.detail.width,
        height: e.detail.height
      });
    },

    // 图片加载失败（预览模式）
    onImageError(e) {
      console.error('预览图片加载失败:', e.detail);
    },

    // 更新图像数据（用于滤镜管理器）
    updateImageData(imageData) {
      const { mainCtx, mainCanvas, cssWidth, cssHeight, dpr } = this.data;

      // 使用CSS尺寸进行绘制，因为坐标系已经通过scale()调整
      const drawWidth = cssWidth || 200;
      const drawHeight = cssHeight || 200;

      console.log('🖼️ updateImageData 开始执行:', {
        hasMainCtx: !!mainCtx,
        hasImageData: !!imageData,
        cssSize: `${cssWidth}x${cssHeight}`,
        drawSize: `${drawWidth}x${drawHeight}`,
        dpr: dpr,
        imageDataSize: imageData ? `${imageData.width}x${imageData.height}` : 'null'
      });

      if (!mainCtx || !imageData) {
        console.error('❌ Canvas上下文或图像数据无效');
        return;
      }

      try {
        // 验证图像数据格式
        if (!imageData.data || !imageData.width || !imageData.height) {
          console.error('❌ 图像数据格式无效:', imageData);
          return;
        }

        // 检查数据长度是否正确
        const expectedLength = imageData.width * imageData.height * 4;
        if (imageData.data.length !== expectedLength) {
          console.error('❌ 图像数据长度不匹配:', {
            expected: expectedLength,
            actual: imageData.data.length,
            width: imageData.width,
            height: imageData.height
          });
          return;
        }

        console.log('📊 图像数据验证通过，开始更新:', {
          imageSize: `${imageData.width}x${imageData.height}`,
          cssSize: `${cssWidth}x${cssHeight}`,
          drawSize: `${drawWidth}x${drawHeight}`,
          dpr: dpr,
          dataLength: imageData.data.length
        });

        // 清空画布（使用CSS尺寸，坐标系已缩放）
        console.log('🧹 清空Canvas画布');
        mainCtx.clearRect(0, 0, drawWidth, drawHeight);

        // 方法1：尝试使用临时Canvas重绘（推荐方案）
        try {
          console.log('🔄 尝试临时Canvas方式更新图像');
          this.updateImageDataWithTempCanvas(mainCtx, imageData);
          console.log('✅ 图像数据已更新到Canvas (临时Canvas方式)');
        } catch (tempCanvasError) {
          console.warn('⚠️ 临时Canvas方式失败，尝试直接putImageData:', tempCanvasError);

          // 方法2：尝试直接使用putImageData（修复版）
          try {
            // 修复：直接在(0,0)位置绘制，让滤镜效果覆盖整个Canvas
            const offsetX = 0;
            const offsetY = 0;

            console.log('🎯 尝试直接putImageData方式（修复版），位置:', { offsetX, offsetY });
            mainCtx.putImageData(imageData, offsetX, offsetY);
            console.log(`✅ 图像数据已更新到Canvas (直接方式) 位置: ${offsetX},${offsetY}`);
          } catch (putError) {
            console.warn('⚠️ 直接putImageData失败，尝试重建ImageData:', putError);

            // 方法3：重建ImageData对象（修复版）
            try {
              console.log('🔧 尝试重建ImageData对象');
              const newImageData = mainCtx.createImageData(imageData.width, imageData.height);
              newImageData.data.set(imageData.data);

              // 修复：直接在(0,0)位置绘制
              const offsetX = 0;
              const offsetY = 0;

              mainCtx.putImageData(newImageData, offsetX, offsetY);
              console.log('✅ 图像数据已更新到Canvas (重建方式)');
            } catch (rebuildError) {
              console.error('❌ 重建ImageData也失败:', rebuildError);

              // 最后的备用方案：使用像素级绘制
              console.log('🔧 尝试像素级绘制备用方案');
              this.drawPixelByPixel(mainCtx, imageData);
            }
          }
        }

        // 强制Canvas刷新（优化版）
        console.log('🔄 开始强制Canvas刷新');
        this.forceCanvasRefreshOptimized(mainCtx);

        console.log('✅ updateImageData 执行完成');

      } catch (error) {
        console.error('❌ 更新图像数据失败:', error);
      }
    },

    // 使用临时Canvas更新图像数据（推荐方案）
    updateImageDataWithTempCanvas(ctx, imageData) {
      const { cssWidth, cssHeight } = this.data;

      // 使用CSS尺寸进行绘制，坐标系已经通过scale()调整
      const targetWidth = cssWidth || 200;
      const targetHeight = cssHeight || 200;

      try {
        console.log('使用临时Canvas更新图像数据');
        const { width, height, data } = imageData;

        // 创建临时canvas来处理像素数据
        const tempCanvas = wx.createOffscreenCanvas({ type: '2d' });
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');

        // 创建新的ImageData并设置数据
        const tempImageData = tempCtx.createImageData(width, height);
        tempImageData.data.set(data);

        // 绘制到临时canvas
        tempCtx.putImageData(tempImageData, 0, 0);

        // 修复：滤镜处理后的图像应该填满整个Canvas显示区域
        // 使用CSS尺寸进行绘制，坐标系已经通过scale()调整
        const drawX = 0;
        const drawY = 0;
        const targetWidth = this.data.cssWidth || 200;
        const targetHeight = this.data.cssHeight || 200;

        console.log('🎯 修复后的绘制参数:', {
          tempCanvasSize: `${width}x${height}`,
          drawPosition: `${drawX},${drawY}`,
          targetSize: `${targetWidth}x${targetHeight}`,
          cssSize: `${this.data.cssWidth}x${this.data.cssHeight}`,
          dpr: this.data.dpr
        });

        // 从临时canvas绘制到主canvas，填满整个Canvas显示滤镜效果
        ctx.drawImage(tempCanvas, drawX, drawY, targetWidth, targetHeight);

        console.log('临时Canvas绘制完成');
      } catch (tempCanvasError) {
        console.error('临时Canvas绘制失败:', tempCanvasError);
        throw tempCanvasError;
      }
    },

    // 像素级绘制备用方案
    drawPixelByPixel(ctx, imageData) {
      try {
        console.log('使用像素级绘制备用方案');
        const { width, height, data } = imageData;

        // 创建临时canvas来处理像素数据
        const tempCanvas = wx.createOffscreenCanvas({ type: '2d' });
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');

        // 创建新的ImageData
        const tempImageData = tempCtx.createImageData(width, height);
        tempImageData.data.set(data);

        // 绘制到临时canvas
        tempCtx.putImageData(tempImageData, 0, 0);

        // 计算居中位置
        const { canvasWidth, canvasHeight } = this.data;
        const offsetX = Math.max(0, Math.floor((canvasWidth - width) / 2));
        const offsetY = Math.max(0, Math.floor((canvasHeight - height) / 2));

        // 从临时canvas绘制到主canvas
        ctx.drawImage(tempCanvas, offsetX, offsetY);

        console.log('像素级绘制完成');
      } catch (pixelError) {
        console.error('像素级绘制也失败:', pixelError);
      }
    },

    // 获取当前Canvas的图像数据
    getCurrentImageData() {
      const { mainCtx, mainCanvas } = this.data;
      if (!mainCtx || !mainCanvas) return null;

      // 使用Canvas的实际尺寸
      const actualWidth = mainCanvas.width;
      const actualHeight = mainCanvas.height;

      console.log('获取图像数据，Canvas实际尺寸:', { actualWidth, actualHeight });

      // 检查尺寸是否合理
      if (actualWidth <= 0 || actualHeight <= 0) {
        console.warn('Canvas尺寸异常:', { actualWidth, actualHeight });
        return null;
      }

      return this.safeGetImageData(mainCtx, 0, 0, actualWidth, actualHeight);
    },

    // 初始化滤镜管理器的图像数据
    initFilterManagerImageData() {
      // 防止重复初始化
      if (this.data.filterManagerInitialized) {
        console.log('滤镜管理器已初始化，跳过重复初始化');
        return;
      }

      const imageData = this.getCurrentImageData();
      if (imageData) {
        // 标记为已初始化
        this.setData({ filterManagerInitialized: true });

        // 通知父组件初始化滤镜管理器
        this.triggerEvent('imageDataReady', { imageData });
        console.log('滤镜管理器图像数据初始化完成');
      } else {
        console.warn('无法获取图像数据，滤镜管理器初始化失败');
      }
    },

    // 清理资源
    cleanup() {
      if (this.editHistory) {
        this.editHistory.clear();
      }
    }
  }
});
