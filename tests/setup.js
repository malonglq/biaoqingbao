// setup.js - 测试环境设置
const { TextEncoder, TextDecoder } = require('util');

// 设置全局变量
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// 模拟微信小程序全局对象
global.wx = {
  // Canvas相关API
  createSelectorQuery: jest.fn(() => ({
    select: jest.fn(() => ({
      fields: jest.fn(() => ({
        exec: jest.fn((callback) => {
          const mockCanvas = {
            width: 200,
            height: 200,
            getContext: jest.fn(() => ({
              clearRect: jest.fn(),
              drawImage: jest.fn(),
              getImageData: jest.fn(() => ({
                data: new Uint8ClampedArray(200 * 200 * 4).fill(128),
                width: 200,
                height: 200
              })),
              putImageData: jest.fn(),
              imageSmoothingEnabled: true
            })),
            createImage: jest.fn(() => ({
              onload: null,
              onerror: null,
              src: '',
              width: 100,
              height: 100
            })),
            requestAnimationFrame: jest.fn((callback) => {
              setTimeout(callback, 16);
              return 1;
            }),
            style: {}
          };
          callback([{ node: mockCanvas }]);
        })
      }))
    }))
  })),

  // 导航相关API
  navigateBack: jest.fn(),
  navigateTo: jest.fn(),
  redirectTo: jest.fn(),
  switchTab: jest.fn(),
  reLaunch: jest.fn(),

  // 交互相关API
  showToast: jest.fn(),
  showModal: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  showActionSheet: jest.fn(),

  // 文件相关API
  canvasToTempFilePath: jest.fn((options) => {
    if (options.success) {
      options.success({ tempFilePath: 'mock-temp-file-path.jpg' });
    }
  }),

  // 系统信息API
  getSystemInfo: jest.fn(),
  getSystemInfoSync: jest.fn(() => ({
    windowWidth: 375,
    windowHeight: 667,
    pixelRatio: 2
  })),

  // 存储API
  setStorage: jest.fn(),
  getStorage: jest.fn(),
  removeStorage: jest.fn(),
  clearStorage: jest.fn(),

  // 网络API
  request: jest.fn(),
  uploadFile: jest.fn(),
  downloadFile: jest.fn()
};

// 模拟Component构造函数
global.Component = jest.fn((options) => {
  const component = {
    data: options.data || {},
    properties: options.properties || {},
    methods: options.methods || {},
    lifetimes: options.lifetimes || {},
    observers: options.observers || {},
    
    setData: jest.fn(function(newData, callback) {
      Object.assign(this.data, newData);
      if (callback) callback();
    }),
    
    triggerEvent: jest.fn(),
    createSelectorQuery: global.wx.createSelectorQuery,
    selectComponent: jest.fn()
  };
  
  // 合并methods到component
  Object.assign(component, options.methods);
  
  return component;
});

// 模拟Page构造函数
global.Page = jest.fn((options) => {
  const page = {
    data: options.data || {},
    
    setData: jest.fn(function(newData, callback) {
      Object.assign(this.data, newData);
      if (callback) callback();
    }),
    
    selectComponent: jest.fn(),
    createSelectorQuery: global.wx.createSelectorQuery
  };
  
  // 合并页面方法到page
  Object.keys(options).forEach(key => {
    if (typeof options[key] === 'function') {
      page[key] = options[key];
    }
  });
  
  return page;
});

// 模拟getCurrentPages
global.getCurrentPages = jest.fn(() => [
  {
    route: 'pages/index/index',
    updateEditedImage: jest.fn()
  },
  {
    route: 'pages/image-editor/image-editor'
  }
]);

// 模拟console方法（避免测试输出过多日志）
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// 模拟Canvas API
global.HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  clearRect: jest.fn(),
  drawImage: jest.fn(),
  getImageData: jest.fn(() => ({
    data: new Uint8ClampedArray(200 * 200 * 4).fill(128),
    width: 200,
    height: 200
  })),
  putImageData: jest.fn(),
  fillRect: jest.fn(),
  strokeRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  arc: jest.fn(),
  imageSmoothingEnabled: true
}));

// 模拟Image对象
global.Image = class {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.src = '';
    this.width = 100;
    this.height = 100;
  }
  
  set src(value) {
    this._src = value;
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }
  
  get src() {
    return this._src;
  }
};

// 模拟requestAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => {
  setTimeout(callback, 16);
  return 1;
});

global.cancelAnimationFrame = jest.fn();

// 模拟performance
global.performance = {
  now: jest.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    jsHeapSizeLimit: 4000000
  }
};

// 设置测试超时
jest.setTimeout(10000);

// 清理函数
afterEach(() => {
  jest.clearAllMocks();
});

// 全局错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// 导出工具函数
global.testUtils = {
  // 等待异步操作完成
  waitFor: (condition, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const check = () => {
        if (condition()) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Timeout waiting for condition'));
        } else {
          setTimeout(check, 10);
        }
      };
      check();
    });
  },
  
  // 模拟延迟
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // 创建模拟图像数据
  createMockImageData: (width = 200, height = 200, fillValue = 128) => ({
    data: new Uint8ClampedArray(width * height * 4).fill(fillValue),
    width,
    height
  })
};
