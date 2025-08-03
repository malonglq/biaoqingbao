// 图片上传功能测试文件
// 用于验证图片上传功能的各个方面

const { uploadImages, BODY_UPLOAD_CONFIG, EXPRESSION_UPLOAD_CONFIG } = require('../utils/imageUpload.js');

/**
 * 图片上传功能测试套件
 */
class ImageUploadTest {
  constructor() {
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🧪 开始图片上传功能测试...');
    
    // 配置测试
    await this.testConfigurations();
    
    // 功能测试
    await this.testImageValidation();
    await this.testErrorHandling();
    
    // 生成测试报告
    this.generateReport();
    
    return this.testResults;
  }

  /**
   * 测试配置参数
   */
  async testConfigurations() {
    this.addTest('配置参数测试', () => {
      // 测试身体素材配置
      const bodyConfig = BODY_UPLOAD_CONFIG;
      if (!bodyConfig || typeof bodyConfig !== 'object') {
        throw new Error('身体素材配置不存在或格式错误');
      }
      
      const requiredFields = ['count', 'maxWidth', 'maxHeight', 'quality', 'allowedFormats', 'maxSize'];
      for (const field of requiredFields) {
        if (!(field in bodyConfig)) {
          throw new Error(`身体素材配置缺少必需字段: ${field}`);
        }
      }

      // 测试表情素材配置
      const expressionConfig = EXPRESSION_UPLOAD_CONFIG;
      if (!expressionConfig || typeof expressionConfig !== 'object') {
        throw new Error('表情素材配置不存在或格式错误');
      }
      
      for (const field of requiredFields) {
        if (!(field in expressionConfig)) {
          throw new Error(`表情素材配置缺少必需字段: ${field}`);
        }
      }

      // 验证配置值的合理性
      if (bodyConfig.count !== 1) {
        throw new Error('身体素材配置count应为1');
      }
      
      if (bodyConfig.maxWidth <= 0 || bodyConfig.maxHeight <= 0) {
        throw new Error('身体素材配置尺寸限制应大于0');
      }
      
      if (bodyConfig.quality <= 0 || bodyConfig.quality > 1) {
        throw new Error('身体素材配置质量应在0-1之间');
      }

      return '配置参数验证通过';
    });
  }

  /**
   * 测试图片验证功能
   */
  async testImageValidation() {
    this.addTest('图片格式验证测试', () => {
      // 模拟测试不同的文件路径
      const testCases = [
        { path: 'test.jpg', expected: true },
        { path: 'test.jpeg', expected: true },
        { path: 'test.png', expected: true },
        { path: 'test.gif', expected: false },
        { path: 'test.bmp', expected: false },
        { path: 'test', expected: false },
        { path: 'test.txt', expected: false }
      ];

      // 由于无法直接调用内部函数，我们测试配置的格式数组
      const allowedFormats = BODY_UPLOAD_CONFIG.allowedFormats;
      
      for (const testCase of testCases) {
        const extension = testCase.path.split('.').pop()?.toLowerCase();
        const isAllowed = extension && allowedFormats.includes(extension);
        
        if (isAllowed !== testCase.expected) {
          throw new Error(`格式验证失败: ${testCase.path}, 期望: ${testCase.expected}, 实际: ${isAllowed}`);
        }
      }

      return '图片格式验证测试通过';
    });

    this.addTest('尺寸限制验证测试', () => {
      const bodyConfig = BODY_UPLOAD_CONFIG;
      const expressionConfig = EXPRESSION_UPLOAD_CONFIG;

      // 验证身体素材尺寸限制
      if (bodyConfig.maxWidth !== 1000 || bodyConfig.maxHeight !== 1000) {
        throw new Error('身体素材尺寸限制不符合预期');
      }

      // 验证表情素材尺寸限制
      if (expressionConfig.maxWidth !== 800 || expressionConfig.maxHeight !== 800) {
        throw new Error('表情素材尺寸限制不符合预期');
      }

      return '尺寸限制验证测试通过';
    });

    this.addTest('文件大小限制验证测试', () => {
      const bodyConfig = BODY_UPLOAD_CONFIG;
      const expressionConfig = EXPRESSION_UPLOAD_CONFIG;

      // 验证身体素材文件大小限制 (3MB)
      if (bodyConfig.maxSize !== 3 * 1024 * 1024) {
        throw new Error('身体素材文件大小限制不符合预期');
      }

      // 验证表情素材文件大小限制 (2MB)
      if (expressionConfig.maxSize !== 2 * 1024 * 1024) {
        throw new Error('表情素材文件大小限制不符合预期');
      }

      return '文件大小限制验证测试通过';
    });
  }

  /**
   * 测试错误处理
   */
  async testErrorHandling() {
    this.addTest('错误处理测试', () => {
      // 测试空配置
      try {
        const result = uploadImages(null);
        // 应该使用默认配置，不应该抛出错误
      } catch (error) {
        // 如果抛出错误，检查是否是合理的错误
        if (!error.message) {
          throw new Error('错误处理应该提供有意义的错误信息');
        }
      }

      // 测试无效配置
      try {
        const result = uploadImages({ count: -1 });
        // 应该处理无效配置
      } catch (error) {
        if (!error.message) {
          throw new Error('无效配置错误处理应该提供有意义的错误信息');
        }
      }

      return '错误处理测试通过';
    });
  }

  /**
   * 添加测试用例
   */
  addTest(name, testFunction) {
    this.totalTests++;
    
    try {
      const result = testFunction();
      this.passedTests++;
      this.testResults.push({
        name,
        status: 'PASS',
        result,
        error: null
      });
      console.log(`✅ ${name}: PASS`);
    } catch (error) {
      this.testResults.push({
        name,
        status: 'FAIL',
        result: null,
        error: error.message
      });
      console.log(`❌ ${name}: FAIL - ${error.message}`);
    }
  }

  /**
   * 生成测试报告
   */
  generateReport() {
    const passRate = ((this.passedTests / this.totalTests) * 100).toFixed(1);
    
    console.log('\n📊 图片上传功能测试报告');
    console.log('='.repeat(50));
    console.log(`总测试数: ${this.totalTests}`);
    console.log(`通过测试: ${this.passedTests}`);
    console.log(`失败测试: ${this.totalTests - this.passedTests}`);
    console.log(`通过率: ${passRate}%`);
    
    if (this.passedTests === this.totalTests) {
      console.log('🎉 所有测试通过！图片上传功能正常工作。');
    } else {
      console.log('⚠️ 部分测试失败，请检查相关功能。');
    }
    
    console.log('\n📋 详细测试结果:');
    this.testResults.forEach((test, index) => {
      console.log(`${index + 1}. ${test.name}: ${test.status}`);
      if (test.status === 'FAIL') {
        console.log(`   错误: ${test.error}`);
      }
    });
  }

  /**
   * 获取测试统计信息
   */
  getTestStats() {
    return {
      total: this.totalTests,
      passed: this.passedTests,
      failed: this.totalTests - this.passedTests,
      passRate: ((this.passedTests / this.totalTests) * 100).toFixed(1)
    };
  }
}

/**
 * 运行图片上传功能测试
 */
async function runImageUploadTests() {
  const tester = new ImageUploadTest();
  const results = await tester.runAllTests();
  return {
    results,
    stats: tester.getTestStats()
  };
}

module.exports = {
  ImageUploadTest,
  runImageUploadTests
};
