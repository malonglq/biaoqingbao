// filter-integration.test.js - 滤镜功能集成测试
const puppeteer = require('puppeteer');
const path = require('path');

describe('滤镜功能集成测试', () => {
  let browser;
  let page;
  
  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false, // 设置为false以便观察测试过程
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    
    // 设置视口大小模拟手机屏幕
    await page.setViewport({ width: 375, height: 667 });
    
    // 加载测试页面
    const testPagePath = path.resolve(__dirname, '../fixtures/filter-test-page.html');
    await page.goto(`file://${testPagePath}`);
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    // 重置页面状态
    await page.reload();
    await page.waitForSelector('#canvas-editor', { timeout: 5000 });
  });

  describe('滤镜闪烁问题验证', () => {
    test('透明度滤镜应该稳定显示不闪烁', async () => {
      // 选择透明度工具
      await page.click('[data-tool="opacity"]');
      await page.waitForSelector('.param-slider', { visible: true });
      
      // 记录Canvas初始状态
      const initialImageData = await page.evaluate(() => {
        const canvas = document.querySelector('#mainCanvas');
        const ctx = canvas.getContext('2d');
        return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      });
      
      // 调整透明度
      await page.evaluate(() => {
        const slider = document.querySelector('.param-slider');
        slider.value = 50;
        slider.dispatchEvent(new Event('change'));
      });
      
      // 等待滤镜处理完成
      await page.waitForTimeout(200);
      
      // 检查Canvas状态是否稳定
      const processedImageData = await page.evaluate(() => {
        const canvas = document.querySelector('#mainCanvas');
        const ctx = canvas.getContext('2d');
        return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      });
      
      // 验证图像确实发生了变化（应用了透明度）
      expect(processedImageData).not.toEqual(initialImageData);
      
      // 等待一段时间，再次检查确保没有闪烁回原图
      await page.waitForTimeout(500);
      
      const finalImageData = await page.evaluate(() => {
        const canvas = document.querySelector('#mainCanvas');
        const ctx = canvas.getContext('2d');
        return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      });
      
      // 验证图像保持稳定，没有闪烁回原图
      expect(finalImageData).toEqual(processedImageData);
    });

    test('黑白滤镜应该稳定显示不闪烁', async () => {
      // 选择黑白滤镜工具
      await page.click('[data-tool="grayscale"]');
      await page.waitForSelector('.param-slider', { visible: true });
      
      // 记录Canvas初始状态
      const initialImageData = await page.evaluate(() => {
        const canvas = document.querySelector('#mainCanvas');
        const ctx = canvas.getContext('2d');
        return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      });
      
      // 应用黑白滤镜
      await page.evaluate(() => {
        const slider = document.querySelector('.param-slider');
        slider.value = 100;
        slider.dispatchEvent(new Event('change'));
      });
      
      // 等待滤镜处理完成
      await page.waitForTimeout(200);
      
      // 检查Canvas状态
      const processedImageData = await page.evaluate(() => {
        const canvas = document.querySelector('#mainCanvas');
        const ctx = canvas.getContext('2d');
        return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      });
      
      // 验证图像确实发生了变化
      expect(processedImageData).not.toEqual(initialImageData);
      
      // 等待一段时间，确保没有闪烁
      await page.waitForTimeout(500);
      
      const finalImageData = await page.evaluate(() => {
        const canvas = document.querySelector('#mainCanvas');
        const ctx = canvas.getContext('2d');
        return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      });
      
      // 验证图像保持稳定
      expect(finalImageData).toEqual(processedImageData);
    });
  });

  describe('实时滤镜调节测试', () => {
    test('快速拖动透明度滑块应该流畅响应', async () => {
      await page.click('[data-tool="opacity"]');
      await page.waitForSelector('.param-slider', { visible: true });
      
      // 模拟快速拖动滑块
      const slider = await page.$('.param-slider');
      const sliderBox = await slider.boundingBox();
      
      // 快速移动滑块从0到100
      const steps = 10;
      for (let i = 0; i <= steps; i++) {
        const x = sliderBox.x + (sliderBox.width * i / steps);
        const y = sliderBox.y + sliderBox.height / 2;
        
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.up();
        await page.waitForTimeout(50); // 模拟快速操作
      }
      
      // 验证没有JavaScript错误
      const errors = await page.evaluate(() => {
        return window.testErrors || [];
      });
      expect(errors).toHaveLength(0);
      
      // 验证最终状态正确
      const finalOpacity = await page.evaluate(() => {
        return document.querySelector('.param-slider').value;
      });
      expect(parseInt(finalOpacity)).toBeGreaterThan(80);
    });
  });

  describe('并发操作测试', () => {
    test('快速切换不同滤镜应该不会产生冲突', async () => {
      // 快速切换透明度和黑白滤镜
      await page.click('[data-tool="opacity"]');
      await page.waitForTimeout(50);
      
      await page.click('[data-tool="grayscale"]');
      await page.waitForTimeout(50);
      
      await page.click('[data-tool="opacity"]');
      await page.waitForTimeout(50);
      
      // 验证没有错误
      const errors = await page.evaluate(() => {
        return window.testErrors || [];
      });
      expect(errors).toHaveLength(0);
      
      // 验证最终状态正确
      const activeTool = await page.evaluate(() => {
        return document.querySelector('.tool-btn.active').dataset.tool;
      });
      expect(activeTool).toBe('opacity');
    });
  });

  describe('性能测试', () => {
    test('滤镜处理应该在合理时间内完成', async () => {
      await page.click('[data-tool="opacity"]');
      
      const startTime = Date.now();
      
      // 应用透明度滤镜
      await page.evaluate(() => {
        const slider = document.querySelector('.param-slider');
        slider.value = 50;
        slider.dispatchEvent(new Event('change'));
      });
      
      // 等待处理完成
      await page.waitForFunction(() => {
        return !document.querySelector('.loading-overlay');
      }, { timeout: 2000 });
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      // 验证处理时间在合理范围内（小于1秒）
      expect(processingTime).toBeLessThan(1000);
    });
  });

  describe('内存泄漏测试', () => {
    test('重复应用滤镜不应该导致内存泄漏', async () => {
      await page.click('[data-tool="opacity"]');
      
      // 记录初始内存使用
      const initialMemory = await page.evaluate(() => {
        return performance.memory ? performance.memory.usedJSHeapSize : 0;
      });
      
      // 重复应用滤镜100次
      for (let i = 0; i < 100; i++) {
        await page.evaluate((opacity) => {
          const slider = document.querySelector('.param-slider');
          slider.value = opacity;
          slider.dispatchEvent(new Event('change'));
        }, 50 + (i % 50));
        
        if (i % 10 === 0) {
          await page.waitForTimeout(100); // 偶尔暂停让垃圾回收运行
        }
      }
      
      // 强制垃圾回收
      await page.evaluate(() => {
        if (window.gc) {
          window.gc();
        }
      });
      
      await page.waitForTimeout(1000);
      
      // 检查最终内存使用
      const finalMemory = await page.evaluate(() => {
        return performance.memory ? performance.memory.usedJSHeapSize : 0;
      });
      
      // 验证内存增长在合理范围内（不超过初始内存的2倍）
      if (initialMemory > 0) {
        expect(finalMemory).toBeLessThan(initialMemory * 2);
      }
    });
  });
});
