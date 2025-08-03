// jest.config.js - Jest测试配置
module.exports = {
  // 测试环境
  testEnvironment: 'jsdom',
  
  // 测试文件匹配模式
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],
  
  // 模块路径映射
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/miniprogram/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // 设置文件
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js'
  ],
  
  // 覆盖率配置
  collectCoverage: true,
  collectCoverageFrom: [
    'miniprogram/components/**/*.js',
    'miniprogram/pages/**/*.js',
    '!miniprogram/**/*.test.js',
    '!miniprogram/**/node_modules/**'
  ],
  coverageDirectory: 'tests/coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  
  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // 模拟模块
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  
  // 转换配置
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // 忽略转换的模块
  transformIgnorePatterns: [
    'node_modules/(?!(some-es6-module)/)'
  ],
  
  // 测试超时
  testTimeout: 10000,
  
  // 详细输出
  verbose: true,
  
  // 清理模拟
  clearMocks: true,
  restoreMocks: true,
  
  // 全局变量
  globals: {
    'wx': {}
  }
};
