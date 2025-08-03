// test.js - 测试页面
const scrollTests = require('../../tests/scroll-test.js');

Page({
  data: {
    testResults: [],
    isRunning: false,
    testReport: null,
    debugInfo: null,
    testImageUrl: ''
  },

  onLoad() {
    console.log('测试页面加载完成');
  },

  // 运行滑动功能测试
  async runScrollTests() {
    this.setData({
      isRunning: true,
      testResults: [],
      testReport: null
    });

    try {
      wx.showLoading({
        title: '正在运行测试...'
      });

      // 等待页面渲染完成
      await this.waitForPageReady();

      // 运行所有测试
      const results = await scrollTests.runAllTests();
      const report = scrollTests.generateReport(results);

      this.setData({
        testResults: results,
        testReport: report,
        isRunning: false
      });

      wx.hideLoading();
      
      // 显示测试结果
      const passRate = report.summary.passRate;
      wx.showToast({
        title: `测试完成 (${passRate})`,
        icon: report.summary.passed === report.summary.total ? 'success' : 'none',
        duration: 2000
      });

    } catch (error) {
      console.error('测试运行失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '测试运行失败',
        icon: 'error'
      });
      
      this.setData({
        isRunning: false
      });
    }
  },

  // 等待页面准备就绪
  waitForPageReady() {
    return new Promise((resolve) => {
      setTimeout(resolve, 500); // 等待500ms确保页面渲染完成
    });
  },

  // 查看详细结果
  viewDetailedResults() {
    if (!this.data.testReport) {
      wx.showToast({
        title: '请先运行测试',
        icon: 'none'
      });
      return;
    }

    const report = this.data.testReport;
    let message = `测试报告\n\n`;
    message += `总计: ${report.summary.total} 项\n`;
    message += `通过: ${report.summary.passed} 项\n`;
    message += `失败: ${report.summary.failed} 项\n`;
    message += `通过率: ${report.summary.passRate}\n\n`;
    
    message += `详细结果:\n`;
    report.details.forEach((result, index) => {
      message += `${index + 1}. ${result.testName}\n`;
      message += `   ${result.message}\n\n`;
    });

    if (report.recommendations.length > 0) {
      message += `改进建议:\n`;
      report.recommendations.forEach((rec, index) => {
        message += `${index + 1}. ${rec}\n`;
      });
    }

    wx.showModal({
      title: '测试详细结果',
      content: message,
      showCancel: false,
      confirmText: '确定'
    });
  },

  // 调试图片显示问题
  async debugImageDisplay() {
    try {
      // 获取主页面的数据
      const pages = getCurrentPages();
      const indexPage = pages.find(page => page.route === 'pages/index/index');

      if (!indexPage) {
        wx.showToast({
          title: '请先打开主页面',
          icon: 'none'
        });
        return;
      }

      const indexData = indexPage.data;
      const debugInfo = {
        selectedBody: indexData.selectedBody,
        selectedExpression: indexData.selectedExpression,
        customBodyImages: indexData.customBodyImages,
        customExpressionImages: indexData.customExpressionImages,
        currentTab: indexData.currentTab
      };

      console.log('主页面调试信息:', debugInfo);

      // 检查图片URL格式
      const checkImageUrl = (url, type) => {
        if (!url) return `${type}: 未选择`;

        const checks = {
          isHttp: url.indexOf('http') === 0,
          isWxfile: url.indexOf('wxfile') === 0,
          isBlob: url.indexOf('blob:') === 0,
          isData: url.indexOf('data:') === 0,
          hasSlash: url.indexOf('/') >= 0,
          length: url.length,
          isLongString: url.length > 20
        };

        const shouldShowAsImage = checks.isHttp || checks.isWxfile || checks.isBlob || checks.isData || checks.hasSlash || checks.isLongString;

        return {
          url,
          checks,
          shouldShowAsImage,
          displayType: shouldShowAsImage ? '图片' : '文本'
        };
      };

      const bodyAnalysis = checkImageUrl(debugInfo.selectedBody, 'selectedBody');
      const expressionAnalysis = checkImageUrl(debugInfo.selectedExpression, 'selectedExpression');

      this.setData({
        debugInfo: {
          ...debugInfo,
          bodyAnalysis,
          expressionAnalysis
        }
      });

      // 显示调试信息
      let message = '图片显示调试信息:\n\n';
      message += `当前标签页: ${debugInfo.currentTab}\n\n`;
      message += `身体图片:\n`;
      message += `- URL: ${bodyAnalysis.url || '无'}\n`;
      message += `- 显示类型: ${bodyAnalysis.displayType}\n`;
      message += `- 长度: ${bodyAnalysis.checks?.length || 0}\n\n`;
      message += `表情图片:\n`;
      message += `- URL: ${expressionAnalysis.url || '无'}\n`;
      message += `- 显示类型: ${expressionAnalysis.displayType}\n`;
      message += `- 长度: ${expressionAnalysis.checks?.length || 0}\n\n`;
      message += `自定义图片数量:\n`;
      message += `- 身体: ${debugInfo.customBodyImages?.length || 0}\n`;
      message += `- 表情: ${debugInfo.customExpressionImages?.length || 0}`;

      wx.showModal({
        title: '图片显示调试',
        content: message,
        showCancel: false,
        confirmText: '确定'
      });

    } catch (error) {
      console.error('调试失败:', error);
      wx.showToast({
        title: '调试失败',
        icon: 'error'
      });
    }
  },

  // 测试图片URL
  testImageUrl() {
    const url = this.data.testImageUrl.trim();
    if (!url) {
      wx.showToast({
        title: '请输入图片URL',
        icon: 'none'
      });
      return;
    }

    // 验证URL格式
    const isValidUrl = url.startsWith('wxfile://') ||
                      url.startsWith('http://') ||
                      url.startsWith('https://') ||
                      url.startsWith('blob:') ||
                      url.startsWith('data:') ||
                      url.indexOf('/') >= 0;

    console.log('测试图片URL:', {
      url: url,
      isValidUrl: isValidUrl,
      urlType: this.getUrlType(url)
    });

    this.setData({
      testImageUrl: url
    });

    if (!isValidUrl) {
      wx.showToast({
        title: '可能不是有效的图片URL',
        icon: 'none'
      });
    }
  },

  // 获取URL类型
  getUrlType(url) {
    if (url.startsWith('wxfile://')) return 'wxfile';
    if (url.startsWith('http://') || url.startsWith('https://')) return 'http';
    if (url.startsWith('blob:')) return 'blob';
    if (url.startsWith('data:')) return 'data';
    if (url.indexOf('/') >= 0) return 'path';
    return 'unknown';
  },

  // 输入测试URL
  onTestUrlInput(e) {
    this.setData({
      testImageUrl: e.detail.value
    });
  },

  // 测试图片加载成功
  handleTestImageLoad(e) {
    console.log('测试图片加载成功:', e.detail);
    wx.showToast({
      title: '图片加载成功',
      icon: 'success'
    });
  },

  // 测试图片加载失败
  handleTestImageError(e) {
    console.error('测试图片加载失败:', e.detail);
    wx.showToast({
      title: '图片加载失败',
      icon: 'error'
    });
  },

  // 返回主页面
  goBack() {
    wx.navigateBack();
  }
});
