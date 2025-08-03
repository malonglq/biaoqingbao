// canvas-editor-filter.test.js - 滤镜功能单元测试
const path = require('path');

// 模拟微信小程序环境
global.wx = {
  createSelectorQuery: () => ({
    select: () => ({
      fields: () => ({
        exec: (callback) => {
          // 模拟Canvas节点
          const mockCanvas = {
            width: 200,
            height: 200,
            getContext: (type) => ({
              clearRect: jest.fn(),
              drawImage: jest.fn(),
              getImageData: jest.fn(() => ({
                data: new Uint8ClampedArray(200 * 200 * 4).fill(128),
                width: 200,
                height: 200
              })),
              putImageData: jest.fn(),
              imageSmoothingEnabled: true
            }),
            createImage: () => ({
              onload: null,
              onerror: null,
              src: '',
              width: 100,
              height: 100
            }),
            requestAnimationFrame: jest.fn((callback) => {
              setTimeout(callback, 16);
              return 1;
            }),
            style: {}
          };
          callback([{ node: mockCanvas }]);
        })
      })
    })
  })
};

// 模拟组件环境
const mockComponent = {
  data: {
    isLoading: false,
    loadingText: '',
    mainCanvas: null,
    mainCtx: null,
    offscreenCanvas: null,
    offscreenCtx: null,
    canvasInitFailed: false,
    originalImage: null,
    currentImageData: null,
    imageScale: 1,
    imageOffsetX: 0,
    imageOffsetY: 0,
    isDrawing: false,
    lastPoint: null,
    brushSize: 20,
    brushColor: '#FF6B6B',
    currentOpacity: 100,
    isProcessingFilter: false,
    filterProcessingType: null,
    isRealtimeOpacity: false,
    canvasWidth: 200,
    canvasHeight: 200
  },
  setData: jest.fn(function(newData) {
    Object.assign(this.data, newData);
  }),
  triggerEvent: jest.fn(),
  createSelectorQuery: wx.createSelectorQuery,
  properties: {
    imageSrc: 'test-image.jpg'
  }
};

// 加载Canvas编辑器组件方法
const canvasEditorPath = path.resolve(__dirname, '../../miniprogram/components/canvas-editor/canvas-editor.js');
delete require.cache[canvasEditorPath];

// 模拟require函数
const originalRequire = require;
jest.doMock('../../utils/editHistory.js', () => ({
  createEditHistory: () => ({
    push: jest.fn(),
    canUndo: () => false,
    canRedo: () => false,
    hasChanges: () => false,
    clear: jest.fn()
  })
}));

describe('Canvas Editor Filter Tests', () => {
  let canvasEditor;
  let mockCanvas, mockCtx, mockOffscreenCanvas, mockOffscreenCtx;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // 重新创建mock对象
    mockCtx = {
      clearRect: jest.fn(),
      drawImage: jest.fn(),
      getImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(200 * 200 * 4).fill(128),
        width: 200,
        height: 200
      })),
      putImageData: jest.fn(),
      imageSmoothingEnabled: true
    };

    mockOffscreenCtx = {
      clearRect: jest.fn(),
      drawImage: jest.fn(),
      getImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(200 * 200 * 4).fill(128),
        width: 200,
        height: 200
      })),
      putImageData: jest.fn(),
      imageSmoothingEnabled: true
    };

    mockCanvas = {
      width: 200,
      height: 200,
      getContext: () => mockCtx,
      createImage: () => ({
        onload: null,
        onerror: null,
        src: '',
        width: 100,
        height: 100
      }),
      requestAnimationFrame: jest.fn((callback) => {
        setTimeout(callback, 0);
        return 1;
      }),
      style: {}
    };

    mockOffscreenCanvas = {
      width: 200,
      height: 200,
      getContext: () => mockOffscreenCtx
    };

    // 创建组件实例
    canvasEditor = Object.create(mockComponent);
    canvasEditor.data = { ...mockComponent.data };
    canvasEditor.setData = mockComponent.setData.bind(canvasEditor);
    
    // 设置初始Canvas状态
    canvasEditor.data.mainCanvas = mockCanvas;
    canvasEditor.data.mainCtx = mockCtx;
    canvasEditor.data.offscreenCanvas = mockOffscreenCanvas;
    canvasEditor.data.offscreenCtx = mockOffscreenCtx;
    canvasEditor.data.originalImage = {
      width: 100,
      height: 100
    };
    canvasEditor.data.imageScale = 1;
    canvasEditor.data.imageOffsetX = 50;
    canvasEditor.data.imageOffsetY = 50;

    // 加载组件方法
    const componentCode = require('fs').readFileSync(canvasEditorPath, 'utf8');
    const methodsMatch = componentCode.match(/methods:\s*{([\s\S]*?)}\s*}\);/);
    if (methodsMatch) {
      const methodsCode = methodsMatch[1];
      const methods = eval(`({${methodsCode}})`);
      Object.assign(canvasEditor, methods);
    }

    // 模拟editHistory
    canvasEditor.editHistory = {
      push: jest.fn(),
      canUndo: () => false,
      canRedo: () => false,
      hasChanges: () => false
    };
  });

  describe('滤镜状态管理测试', () => {
    test('应该正确设置和清除滤镜处理状态', () => {
      expect(canvasEditor.data.isProcessingFilter).toBe(false);
      expect(canvasEditor.data.filterProcessingType).toBe(null);
    });

    test('应该防止重复的滤镜处理', () => {
      // 设置正在处理透明度滤镜
      canvasEditor.setData({
        isProcessingFilter: true,
        filterProcessingType: 'opacity'
      });

      const initialCallCount = mockCtx.putImageData.mock.calls.length;
      
      // 尝试再次应用透明度滤镜
      canvasEditor.applyOpacity(50);
      
      // 应该被阻止，putImageData不应该被调用
      expect(mockCtx.putImageData.mock.calls.length).toBe(initialCallCount);
    });
  });

  describe('透明度滤镜测试', () => {
    test('应该正确应用透明度滤镜', (done) => {
      const opacity = 50;
      
      canvasEditor.applyOpacity(opacity);
      
      setTimeout(() => {
        // 验证离屏Canvas被清空和绘制
        expect(mockOffscreenCtx.clearRect).toHaveBeenCalledWith(0, 0, 200, 200);
        expect(mockOffscreenCtx.drawImage).toHaveBeenCalled();
        
        // 验证主Canvas被更新
        expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 200, 200);
        expect(mockCtx.putImageData).toHaveBeenCalled();
        
        // 验证状态被正确清除
        expect(canvasEditor.data.isProcessingFilter).toBe(false);
        expect(canvasEditor.data.filterProcessingType).toBe(null);
        
        done();
      }, 50);
    });

    test('应该正确处理实时透明度调节', (done) => {
      canvasEditor.setData({ isRealtimeOpacity: true });
      
      canvasEditor.applyOpacity(75);
      
      setTimeout(() => {
        // 实时模式下不应该显示加载状态
        expect(canvasEditor.data.isLoading).toBe(false);
        
        // 但仍应该处理滤镜
        expect(mockCtx.putImageData).toHaveBeenCalled();
        
        done();
      }, 50);
    });

    test('透明度滤镜算法应该正确', () => {
      const imageData = {
        data: new Uint8ClampedArray([255, 255, 255, 255, 128, 128, 128, 128]),
        width: 2,
        height: 1
      };
      
      const result = canvasEditor.applyOpacityFilter(imageData, 50);
      
      // 验证alpha通道被正确修改
      expect(result.data[3]).toBe(128); // 255 * 0.5 = 127.5 -> 128
      expect(result.data[7]).toBe(64);  // 128 * 0.5 = 64
    });
  });

  describe('黑白滤镜测试', () => {
    test('应该正确应用黑白滤镜', (done) => {
      const intensity = 100;
      
      canvasEditor.applyGrayscaleWithIntensity(intensity);
      
      setTimeout(() => {
        // 验证Canvas操作
        expect(mockOffscreenCtx.clearRect).toHaveBeenCalled();
        expect(mockOffscreenCtx.drawImage).toHaveBeenCalled();
        expect(mockCtx.putImageData).toHaveBeenCalled();
        
        // 验证加载状态
        expect(canvasEditor.data.isLoading).toBe(false);
        
        done();
      }, 50);
    });

    test('黑白滤镜算法应该正确', () => {
      const imageData = {
        data: new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255]),
        width: 2,
        height: 1
      };
      
      const result = canvasEditor.applyGrayscaleFilterWithIntensity(imageData, 100);
      
      // 验证RGB值被转换为灰度
      const gray1 = Math.round(0.299 * 255 + 0.587 * 0 + 0.114 * 0); // 红色
      const gray2 = Math.round(0.299 * 0 + 0.587 * 255 + 0.114 * 0); // 绿色
      
      expect(result.data[0]).toBe(gray1); // R
      expect(result.data[1]).toBe(gray1); // G
      expect(result.data[2]).toBe(gray1); // B
      expect(result.data[4]).toBe(gray2); // R
      expect(result.data[5]).toBe(gray2); // G
      expect(result.data[6]).toBe(gray2); // B
    });
  });

  describe('Canvas刷新机制测试', () => {
    test('应该调用强制刷新方法', () => {
      const mockDraw = jest.fn();
      const ctxWithDraw = { ...mockCtx, draw: mockDraw };
      
      canvasEditor.forceCanvasRefresh(ctxWithDraw);
      
      expect(mockDraw).toHaveBeenCalledWith(true);
    });

    test('应该处理没有draw方法的情况', () => {
      expect(() => {
        canvasEditor.forceCanvasRefresh(mockCtx);
      }).not.toThrow();
    });
  });

  describe('requestAnimationFrame机制测试', () => {
    test('应该优先使用Canvas的requestAnimationFrame', (done) => {
      canvasEditor.applyOpacity(60);
      
      setTimeout(() => {
        expect(mockCanvas.requestAnimationFrame).toHaveBeenCalled();
        done();
      }, 50);
    });

    test('应该在requestAnimationFrame不可用时使用setTimeout回退', (done) => {
      // 移除requestAnimationFrame
      canvasEditor.data.mainCanvas.requestAnimationFrame = null;
      
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn(originalSetTimeout);
      
      canvasEditor.applyOpacity(60);
      
      setTimeout(() => {
        expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), 16);
        global.setTimeout = originalSetTimeout;
        done();
      }, 50);
    });
  });

  describe('错误处理测试', () => {
    test('应该处理没有原始图像的情况', () => {
      canvasEditor.data.originalImage = null;
      
      expect(() => {
        canvasEditor.applyOpacity(50);
      }).not.toThrow();
      
      expect(mockCtx.putImageData).not.toHaveBeenCalled();
    });

    test('应该处理滤镜处理过程中的错误', (done) => {
      // 模拟getImageData抛出错误
      mockOffscreenCtx.getImageData.mockImplementation(() => {
        throw new Error('Canvas error');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      canvasEditor.applyOpacity(50);
      
      setTimeout(() => {
        // 验证错误被捕获并且状态被清除
        expect(canvasEditor.data.isProcessingFilter).toBe(false);
        expect(canvasEditor.data.filterProcessingType).toBe(null);
        
        consoleSpy.mockRestore();
        done();
      }, 50);
    });
  });
});
