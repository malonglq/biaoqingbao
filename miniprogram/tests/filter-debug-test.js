// filter-debug-test.js - 滤镜功能调试测试脚本

/**
 * 滤镜功能调试测试
 * 用于验证滤镜调用链路和Canvas更新机制
 */

// 模拟测试环境
const mockWx = {
  createOffscreenCanvas: () => ({
    width: 0,
    height: 0,
    getContext: () => ({
      createImageData: (width, height) => ({
        width,
        height,
        data: new Uint8ClampedArray(width * height * 4)
      })
    })
  })
};

// 如果在测试环境中，设置全局wx对象
if (typeof global !== 'undefined') {
  global.wx = mockWx;
}

/**
 * 测试滤镜调用链路
 */
function testFilterCallChain() {
  console.log('🧪 开始测试滤镜调用链路');

  // 创建测试用的图像数据
  const testImageData = {
    width: 100,
    height: 100,
    data: new Uint8ClampedArray(100 * 100 * 4)
  };

  // 填充测试数据（红色图像）
  for (let i = 0; i < testImageData.data.length; i += 4) {
    testImageData.data[i] = 255;     // R
    testImageData.data[i + 1] = 0;   // G
    testImageData.data[i + 2] = 0;   // B
    testImageData.data[i + 3] = 255; // A
  }

  console.log('📊 测试图像数据创建完成:', {
    size: `${testImageData.width}x${testImageData.height}`,
    dataLength: testImageData.data.length,
    firstPixel: {
      r: testImageData.data[0],
      g: testImageData.data[1],
      b: testImageData.data[2],
      a: testImageData.data[3]
    }
  });

  return testImageData;
}

/**
 * 测试黑白滤镜处理
 */
function testGrayscaleFilter(imageData, intensity = 50) {
  console.log('🎨 测试黑白滤镜处理');

  try {
    // 模拟SimpleFilterManager的applyGrayscaleFilter方法
    const result = {
      width: imageData.width,
      height: imageData.height,
      data: new Uint8ClampedArray(imageData.data)
    };

    const data = result.data;
    const factor = intensity / 100;
    let pixelsChanged = 0;

    // 记录处理前的第一个像素值
    const originalFirstPixel = {
      r: data[0],
      g: data[1],
      b: data[2],
      a: data[3]
    };

    console.log('📊 处理前第一个像素:', originalFirstPixel);

    // 应用黑白滤镜
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // 使用加权平均法计算灰度值
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

      // 根据强度混合原色和灰度
      const newR = Math.round(r + (gray - r) * factor);
      const newG = Math.round(g + (gray - g) * factor);
      const newB = Math.round(b + (gray - b) * factor);

      data[i] = newR;     // R
      data[i + 1] = newG; // G
      data[i + 2] = newB; // B
      // data[i + 3] 保持不变 (Alpha通道)

      // 统计变化的像素
      if (newR !== r || newG !== g || newB !== b) {
        pixelsChanged++;
      }
    }

    // 记录处理后的第一个像素值
    const processedFirstPixel = {
      r: data[0],
      g: data[1],
      b: data[2],
      a: data[3]
    };

    console.log('✅ 黑白滤镜处理完成:', {
      intensity: `${intensity}%`,
      factor: factor,
      pixelsChanged: pixelsChanged,
      totalPixels: data.length / 4,
      originalFirstPixel: originalFirstPixel,
      processedFirstPixel: processedFirstPixel,
      pixelChangeDetected: pixelsChanged > 0,
      pixelChangeRate: `${((pixelsChanged / (data.length / 4)) * 100).toFixed(1)}%`
    });

    return result;

  } catch (error) {
    console.error('❌ 黑白滤镜测试失败:', error);
    return null;
  }
}

/**
 * 测试透明化滤镜处理
 */
function testOpacityFilter(imageData, intensity = 50) {
  console.log('🎨 测试透明化滤镜处理');

  try {
    // 模拟SimpleFilterManager的applyOpacityFilter方法
    const result = {
      width: imageData.width,
      height: imageData.height,
      data: new Uint8ClampedArray(imageData.data)
    };

    const data = result.data;
    const alpha = intensity / 100;
    let alphaChannelsChanged = 0;

    // 记录处理前的第一个像素的Alpha值
    const originalFirstAlpha = data[3];
    console.log('📊 处理前第一个像素Alpha值:', originalFirstAlpha);

    // 应用透明度滤镜
    for (let i = 3; i < data.length; i += 4) {
      const originalAlpha = data[i];
      const newAlpha = Math.round(originalAlpha * alpha);

      // 只修改Alpha通道
      data[i] = newAlpha;

      // 统计变化的Alpha通道
      if (newAlpha !== originalAlpha) {
        alphaChannelsChanged++;
      }
    }

    // 记录处理后的第一个像素的Alpha值
    const processedFirstAlpha = data[3];

    console.log('✅ 透明化滤镜处理完成:', {
      intensity: `${intensity}%`,
      alphaFactor: alpha,
      alphaChannelsChanged: alphaChannelsChanged,
      totalPixels: data.length / 4,
      originalFirstAlpha: originalFirstAlpha,
      processedFirstAlpha: processedFirstAlpha,
      alphaChangeDetected: alphaChannelsChanged > 0,
      alphaChangeRate: `${((alphaChannelsChanged / (data.length / 4)) * 100).toFixed(1)}%`
    });

    return result;

  } catch (error) {
    console.error('❌ 透明化滤镜测试失败:', error);
    return null;
  }
}

/**
 * 运行完整的滤镜测试
 */
function runFilterTests() {
  console.log('🚀 开始运行滤镜功能测试');
  console.log('='.repeat(50));

  // 1. 测试图像数据创建
  const testImageData = testFilterCallChain();
  if (!testImageData) {
    console.error('❌ 测试图像数据创建失败');
    return;
  }

  // 2. 测试黑白滤镜
  console.log('\n📋 测试黑白滤镜 (强度: 0%, 50%, 100%)');
  [0, 50, 100].forEach(intensity => {
    console.log(`\n--- 黑白滤镜强度: ${intensity}% ---`);
    testGrayscaleFilter(testImageData, intensity);
  });

  // 3. 测试透明化滤镜
  console.log('\n📋 测试透明化滤镜 (强度: 0%, 50%, 100%)');
  [0, 50, 100].forEach(intensity => {
    console.log(`\n--- 透明化滤镜强度: ${intensity}% ---`);
    testOpacityFilter(testImageData, intensity);
  });

  console.log('\n' + '='.repeat(50));
  console.log('✅ 滤镜功能测试完成');
}

/**
 * 验证预期的控制台日志输出
 */
function getExpectedLogs() {
  return [
    '🎚️ onParamChanging 触发:',
    '⏰ 防抖定时器触发，开始处理参数变化',
    '🎛️ handleFilterParamChange 开始:',
    '🔄 开始实时预览模式',
    '🎯 previewFilter 开始执行:',
    '📞 调用 applyGrayscaleFilter',
    '🎨 applyGrayscaleFilter 开始执行:',
    '🎯 应用黑白滤镜，强度:',
    '📋 开始克隆图像数据...',
    '✅ 图像数据克隆成功',
    '📊 处理前第一个像素:',
    '✅ 黑白滤镜处理完成:',
    '✅ applyGrayscaleFilter 返回结果:',
    '🖼️ 开始更新Canvas图像数据',
    '🖼️ updateImageData 开始执行:',
    '📊 图像数据验证通过，开始更新:',
    '🧹 清空Canvas画布',
    '🔄 尝试临时Canvas方式更新图像',
    '✅ 图像数据已更新到Canvas (临时Canvas方式)',
    '🔄 开始优化版Canvas刷新',
    '✅ updateImageData 执行完成',
    '✅ 实时预览grayscale滤镜完成，强度:'
  ];
}

// 导出测试函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testFilterCallChain,
    testGrayscaleFilter,
    testOpacityFilter,
    runFilterTests,
    getExpectedLogs
  };
}

// 如果直接运行此文件，执行测试
if (typeof window === 'undefined' && typeof module !== 'undefined') {
  runFilterTests();
}
