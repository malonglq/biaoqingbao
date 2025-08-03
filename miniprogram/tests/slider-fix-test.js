// slider-fix-test.js - 滑块修复测试
// 测试黑白效果滑块和透明度滑块的功能

/**
 * 测试黑白效果滑块功能
 */
function testGrayscaleSlider() {
  console.log('🧪 开始测试黑白效果滑块...');
  
  try {
    // 模拟创建测试用的ImageData
    const testImageData = new ImageData(100, 100);
    
    // 填充测试数据（彩色图像）
    for (let i = 0; i < testImageData.data.length; i += 4) {
      testImageData.data[i] = 255;     // R - 红色
      testImageData.data[i + 1] = 128; // G - 绿色
      testImageData.data[i + 2] = 64;  // B - 蓝色
      testImageData.data[i + 3] = 255; // A - 不透明
    }
    
    // 测试不同强度的黑白效果
    const intensities = [0, 25, 50, 75, 100];
    
    intensities.forEach(intensity => {
      const testData = new ImageData(new Uint8ClampedArray(testImageData.data), 100, 100);
      const result = applyGrayscaleFilterWithIntensity(testData, intensity);
      
      // 验证结果
      const firstPixelR = result.data[0];
      const firstPixelG = result.data[1];
      const firstPixelB = result.data[2];
      
      console.log(`强度 ${intensity}%: RGB(${firstPixelR}, ${firstPixelG}, ${firstPixelB})`);
      
      if (intensity === 0) {
        // 0%强度应该保持原色
        if (firstPixelR === 255 && firstPixelG === 128 && firstPixelB === 64) {
          console.log(`✅ 强度 ${intensity}% 测试通过 - 保持原色`);
        } else {
          console.error(`❌ 强度 ${intensity}% 测试失败 - 应保持原色`);
        }
      } else if (intensity === 100) {
        // 100%强度应该完全变为灰色
        const expectedGray = Math.round(0.299 * 255 + 0.587 * 128 + 0.114 * 64);
        if (firstPixelR === expectedGray && firstPixelG === expectedGray && firstPixelB === expectedGray) {
          console.log(`✅ 强度 ${intensity}% 测试通过 - 完全灰色`);
        } else {
          console.error(`❌ 强度 ${intensity}% 测试失败 - 应为完全灰色`);
        }
      } else {
        // 中间强度应该是原色和灰色的混合
        if (firstPixelR !== 255 && firstPixelG !== 128 && firstPixelB !== 64) {
          console.log(`✅ 强度 ${intensity}% 测试通过 - 混合效果`);
        } else {
          console.error(`❌ 强度 ${intensity}% 测试失败 - 应有混合效果`);
        }
      }
    });
    
  } catch (error) {
    console.error('❌ 黑白效果滑块测试失败:', error);
  }
}

/**
 * 测试透明度滑块功能
 */
function testOpacitySlider() {
  console.log('🧪 开始测试透明度滑块...');
  
  try {
    // 模拟创建测试用的ImageData
    const testImageData = new ImageData(100, 100);
    
    // 填充测试数据（不透明图像）
    for (let i = 0; i < testImageData.data.length; i += 4) {
      testImageData.data[i] = 255;     // R
      testImageData.data[i + 1] = 128; // G
      testImageData.data[i + 2] = 64;  // B
      testImageData.data[i + 3] = 255; // A - 完全不透明
    }
    
    // 测试不同透明度值
    const opacities = [0, 25, 50, 75, 100];
    
    opacities.forEach(opacity => {
      const testData = new ImageData(new Uint8ClampedArray(testImageData.data), 100, 100);
      const result = applyOpacityFilter(testData, opacity);
      
      // 验证结果
      const firstPixelAlpha = result.data[3];
      const expectedAlpha = Math.round(255 * (opacity / 100));
      
      console.log(`透明度 ${opacity}%: Alpha=${firstPixelAlpha}, 期望=${expectedAlpha}`);
      
      if (Math.abs(firstPixelAlpha - expectedAlpha) <= 1) {
        console.log(`✅ 透明度 ${opacity}% 测试通过`);
      } else {
        console.error(`❌ 透明度 ${opacity}% 测试失败`);
      }
    });
    
  } catch (error) {
    console.error('❌ 透明度滑块测试失败:', error);
  }
}

/**
 * 应用带强度的黑白滤镜（测试用）
 */
function applyGrayscaleFilterWithIntensity(imageData, intensity) {
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
}

/**
 * 应用透明度滤镜（测试用）
 */
function applyOpacityFilter(imageData, opacity) {
  const data = imageData.data;
  const alpha = opacity / 100;
  
  for (let i = 3; i < data.length; i += 4) {
    data[i] = Math.round(data[i] * alpha);
  }
  
  return imageData;
}

/**
 * 运行所有测试
 */
function runAllTests() {
  console.log('🚀 开始运行滑块修复测试...');
  console.log('=====================================');
  
  testGrayscaleSlider();
  console.log('');
  testOpacitySlider();
  
  console.log('=====================================');
  console.log('✅ 所有测试完成');
}

// 导出测试函数
module.exports = {
  testGrayscaleSlider,
  testOpacitySlider,
  runAllTests,
  applyGrayscaleFilterWithIntensity,
  applyOpacityFilter
};

// 如果直接运行此文件，执行所有测试
if (typeof require !== 'undefined' && require.main === module) {
  runAllTests();
}
