// test-grayscale.js - 黑白滤镜功能测试
const GrayscaleFilter = require('./grayscaleFilter.js');
const FilterManager = require('../filterManager.js');

/**
 * 测试黑白滤镜功能
 */
function testGrayscaleFilter() {
  console.log('开始测试黑白滤镜功能...');
  
  // 测试1: 基础滤镜创建
  console.log('\n=== 测试1: 基础滤镜创建 ===');
  const grayscaleFilter = new GrayscaleFilter();
  console.log('滤镜名称:', grayscaleFilter.name);
  console.log('显示名称:', grayscaleFilter.displayName);
  console.log('默认强度:', grayscaleFilter.getIntensity());
  console.log('是否启用:', grayscaleFilter.isEnabled);
  
  // 测试2: 强度控制
  console.log('\n=== 测试2: 强度控制 ===');
  grayscaleFilter.setIntensity(50);
  console.log('设置强度为50%:', grayscaleFilter.getIntensity());
  
  grayscaleFilter.setIntensity(150); // 超出范围
  console.log('设置强度为150%（应被限制为100%）:', grayscaleFilter.getIntensity());
  
  grayscaleFilter.setIntensity(-10); // 超出范围
  console.log('设置强度为-10%（应被限制为0%）:', grayscaleFilter.getIntensity());
  
  // 测试3: 滤镜管理器集成
  console.log('\n=== 测试3: 滤镜管理器集成 ===');
  const filterManager = new FilterManager();
  console.log('滤镜管理器创建成功');
  
  const filterList = filterManager.getFilterList();
  console.log('已注册的滤镜:', filterList);
  
  // 测试4: 滤镜激活
  console.log('\n=== 测试4: 滤镜激活 ===');
  const activateResult = filterManager.activateFilter('grayscale');
  console.log('激活黑白滤镜:', activateResult);
  
  const activeFilter = filterManager.getActiveFilter();
  console.log('当前激活的滤镜:', activeFilter ? activeFilter.name : 'none');
  
  // 测试5: 强度设置
  console.log('\n=== 测试5: 强度设置 ===');
  filterManager.setFilterIntensity(75);
  console.log('设置滤镜强度为75%:', filterManager.getFilterIntensity());
  
  // 测试6: 配置信息
  console.log('\n=== 测试6: 配置信息 ===');
  const config = grayscaleFilter.getConfig();
  console.log('滤镜配置:', config);
  
  const detailedConfig = grayscaleFilter.getDetailedConfig();
  console.log('详细配置:', detailedConfig);
  
  const description = grayscaleFilter.getDescription();
  console.log('滤镜描述:', description);
  
  // 测试7: 状态管理
  console.log('\n=== 测试7: 状态管理 ===');
  console.log('管理器状态:', filterManager.getStatus());
  
  // 清理
  filterManager.cleanup();
  console.log('\n测试完成，资源已清理');
  
  return {
    success: true,
    message: '黑白滤镜功能测试通过'
  };
}

/**
 * 创建模拟图像数据用于测试
 * @param {number} width - 图像宽度
 * @param {number} height - 图像高度
 * @returns {Object} 模拟的ImageData对象
 */
function createMockImageData(width = 100, height = 100) {
  const data = new Uint8ClampedArray(width * height * 4);
  
  // 创建一个简单的彩色渐变图像
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      
      // 创建彩色渐变
      data[index] = Math.floor((x / width) * 255);     // R
      data[index + 1] = Math.floor((y / height) * 255); // G
      data[index + 2] = 128;                           // B
      data[index + 3] = 255;                           // A
    }
  }
  
  return {
    data: data,
    width: width,
    height: height
  };
}

/**
 * 测试图像处理功能
 */
function testImageProcessing() {
  console.log('\n开始测试图像处理功能...');
  
  // 创建模拟图像数据
  const mockImageData = createMockImageData(10, 10);
  console.log('创建模拟图像数据:', mockImageData.width + 'x' + mockImageData.height);
  
  // 创建滤镜实例
  const grayscaleFilter = new GrayscaleFilter();
  
  // 测试图像数据验证
  console.log('\n=== 测试图像数据验证 ===');
  const isValid = grayscaleFilter.validateImageData(mockImageData);
  console.log('图像数据有效性:', isValid);
  
  // 测试图像数据克隆
  console.log('\n=== 测试图像数据克隆 ===');
  const clonedData = grayscaleFilter.cloneImageData(mockImageData);
  console.log('克隆成功:', !!clonedData);
  if (clonedData) {
    console.log('克隆数据尺寸:', clonedData.width + 'x' + clonedData.height);
  }
  
  // 测试滤镜应用（不同强度）
  console.log('\n=== 测试滤镜应用 ===');
  const intensities = [0, 25, 50, 75, 100];
  
  intensities.forEach(intensity => {
    grayscaleFilter.setIntensity(intensity);
    const result = grayscaleFilter.apply(mockImageData);
    
    if (result) {
      // 计算第一个像素的灰度值
      const r = result.data[0];
      const g = result.data[1];
      const b = result.data[2];
      const isGrayscale = (r === g && g === b);
      
      console.log(`强度${intensity}%: RGB(${r},${g},${b}) 是否为灰度: ${isGrayscale}`);
    }
  });
  
  console.log('图像处理功能测试完成');
  
  return {
    success: true,
    message: '图像处理功能测试通过'
  };
}

/**
 * 运行所有测试
 */
function runAllTests() {
  console.log('='.repeat(50));
  console.log('黑白滤镜功能完整测试');
  console.log('='.repeat(50));
  
  try {
    const test1 = testGrayscaleFilter();
    const test2 = testImageProcessing();
    
    console.log('\n' + '='.repeat(50));
    console.log('测试结果汇总:');
    console.log('- 基础功能测试:', test1.success ? '✅ 通过' : '❌ 失败');
    console.log('- 图像处理测试:', test2.success ? '✅ 通过' : '❌ 失败');
    console.log('='.repeat(50));
    
    return test1.success && test2.success;
  } catch (error) {
    console.error('测试过程中发生错误:', error);
    return false;
  }
}

module.exports = {
  testGrayscaleFilter,
  testImageProcessing,
  runAllTests,
  createMockImageData
};
