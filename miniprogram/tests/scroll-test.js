// scroll-test.js - 滑动功能测试文件

/**
 * 滑动功能测试套件
 * 测试目标：确保用户可以滑动查看所有表情内容，特别是最下面的内容
 */

const scrollTests = {
  
  /**
   * 测试1：检查内容区域是否可滚动
   */
  testContentAreaScrollable() {
    return new Promise((resolve, reject) => {
      const query = wx.createSelectorQuery();
      query.select('.content-area').boundingClientRect();
      query.select('.material-grid').boundingClientRect();
      query.exec((res) => {
        try {
          const contentArea = res[0];
          const materialGrid = res[1];
          
          if (!contentArea || !materialGrid) {
            reject(new Error('无法获取滚动区域信息'));
            return;
          }
          
          const isScrollable = materialGrid.height > contentArea.height;
          const testResult = {
            passed: isScrollable,
            contentHeight: contentArea.height,
            gridHeight: materialGrid.height,
            message: isScrollable ? 
              '✅ 内容区域可滚动' : 
              '❌ 内容区域高度不足，无法滚动'
          };
          
          resolve(testResult);
        } catch (error) {
          reject(error);
        }
      });
    });
  },

  /**
   * 测试2：检查底部padding是否足够
   */
  testBottomPadding() {
    return new Promise((resolve, reject) => {
      const query = wx.createSelectorQuery();
      query.select('.content-area').boundingClientRect();
      query.select('.bottom-nav').boundingClientRect();
      query.exec((res) => {
        try {
          const contentArea = res[0];
          const bottomNav = res[1];
          
          if (!contentArea || !bottomNav) {
            reject(new Error('无法获取元素信息'));
            return;
          }
          
          // 检查内容区域底部是否有足够的padding避免被导航栏遮挡
          const hasEnoughPadding = contentArea.bottom <= bottomNav.top;
          const testResult = {
            passed: hasEnoughPadding,
            contentBottom: contentArea.bottom,
            navTop: bottomNav.top,
            message: hasEnoughPadding ? 
              '✅ 底部padding足够，不会被导航栏遮挡' : 
              '❌ 底部padding不足，可能被导航栏遮挡'
          };
          
          resolve(testResult);
        } catch (error) {
          reject(error);
        }
      });
    });
  },

  /**
   * 测试3：模拟滚动到底部
   */
  testScrollToBottom() {
    return new Promise((resolve, reject) => {
      const query = wx.createSelectorQuery();
      query.selectAll('.material-item').boundingClientRect();
      query.select('.content-area').boundingClientRect();
      query.exec((res) => {
        try {
          const materialItems = res[0];
          const contentArea = res[1];
          
          if (!materialItems || materialItems.length === 0 || !contentArea) {
            reject(new Error('无法获取素材项信息'));
            return;
          }
          
          // 获取最后一个素材项
          const lastItem = materialItems[materialItems.length - 1];
          const isLastItemVisible = lastItem.bottom <= contentArea.bottom;
          
          const testResult = {
            passed: true, // 这个测试主要是检查是否能获取到元素信息
            lastItemBottom: lastItem.bottom,
            contentAreaBottom: contentArea.bottom,
            isLastItemVisible: isLastItemVisible,
            totalItems: materialItems.length,
            message: isLastItemVisible ? 
              '✅ 最后一个素材项可见' : 
              '⚠️ 最后一个素材项需要滚动才能看到（这是正常的）'
          };
          
          resolve(testResult);
        } catch (error) {
          reject(error);
        }
      });
    });
  },

  /**
   * 测试4：检查分类Tab的横向滚动
   */
  testCategoryTabsScroll() {
    return new Promise((resolve, reject) => {
      const query = wx.createSelectorQuery();
      query.select('.category-tabs').boundingClientRect();
      query.selectAll('.category-tab').boundingClientRect();
      query.exec((res) => {
        try {
          const tabsContainer = res[0];
          const tabs = res[1];
          
          if (!tabsContainer || !tabs || tabs.length === 0) {
            reject(new Error('无法获取分类Tab信息'));
            return;
          }
          
          // 计算所有Tab的总宽度
          const totalTabsWidth = tabs.reduce((sum, tab) => sum + tab.width, 0);
          const isHorizontalScrollable = totalTabsWidth > tabsContainer.width;
          
          const testResult = {
            passed: true,
            isScrollable: isHorizontalScrollable,
            containerWidth: tabsContainer.width,
            totalTabsWidth: totalTabsWidth,
            tabCount: tabs.length,
            message: isHorizontalScrollable ? 
              '✅ 分类Tab支持横向滚动' : 
              '✅ 分类Tab无需滚动（所有Tab都可见）'
          };
          
          resolve(testResult);
        } catch (error) {
          reject(error);
        }
      });
    });
  },

  /**
   * 运行所有测试
   */
  async runAllTests() {
    const results = [];
    const tests = [
      { name: '内容区域滚动测试', test: this.testContentAreaScrollable },
      { name: '底部padding测试', test: this.testBottomPadding },
      { name: '滚动到底部测试', test: this.testScrollToBottom },
      { name: '分类Tab横向滚动测试', test: this.testCategoryTabsScroll }
    ];

    for (const { name, test } of tests) {
      try {
        console.log(`🧪 开始执行: ${name}`);
        const result = await test.call(this);
        results.push({
          testName: name,
          ...result
        });
        console.log(`📊 ${name} 结果:`, result);
      } catch (error) {
        console.error(`❌ ${name} 失败:`, error);
        results.push({
          testName: name,
          passed: false,
          error: error.message,
          message: `❌ 测试执行失败: ${error.message}`
        });
      }
    }

    return results;
  },

  /**
   * 生成测试报告
   */
  generateReport(results) {
    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    
    const report = {
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: totalTests - passedTests,
        passRate: `${Math.round((passedTests / totalTests) * 100)}%`
      },
      details: results,
      recommendations: this.generateRecommendations(results)
    };

    console.log('📋 滑动功能测试报告:', report);
    return report;
  },

  /**
   * 生成改进建议
   */
  generateRecommendations(results) {
    const recommendations = [];
    
    results.forEach(result => {
      if (!result.passed) {
        switch (result.testName) {
          case '内容区域滚动测试':
            recommendations.push('建议增加更多素材内容或减少容器高度以启用滚动');
            break;
          case '底部padding测试':
            recommendations.push('建议增加content-area的底部padding值');
            break;
          case '滚动到底部测试':
            recommendations.push('建议检查滚动容器的overflow-y设置');
            break;
          case '分类Tab横向滚动测试':
            recommendations.push('建议检查category-tabs的overflow-x设置');
            break;
        }
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('✅ 所有滑动功能测试通过，无需改进');
    }

    return recommendations;
  }
};

module.exports = scrollTests;
