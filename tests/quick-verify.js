#!/usr/bin/env node
// quick-verify.js - 快速验证滤镜修复效果

const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 检查修复点
function checkFixPoints() {
  const results = [];
  
  // 检查Canvas编辑器文件
  const canvasEditorPath = path.resolve(__dirname, '../miniprogram/components/canvas-editor/canvas-editor.js');
  
  if (!fs.existsSync(canvasEditorPath)) {
    results.push({
      name: 'Canvas编辑器文件存在性',
      status: 'fail',
      message: '文件不存在'
    });
    return results;
  }
  
  const canvasEditorContent = fs.readFileSync(canvasEditorPath, 'utf8');
  
  // 检查点1：状态管理字段
  const hasFilterState = canvasEditorContent.includes('isProcessingFilter') && 
                         canvasEditorContent.includes('filterProcessingType');
  results.push({
    name: '滤镜状态管理字段',
    status: hasFilterState ? 'pass' : 'fail',
    message: hasFilterState ? '已添加状态管理字段' : '缺少状态管理字段'
  });
  
  // 检查点2：requestAnimationFrame使用
  const usesRAF = canvasEditorContent.includes('requestAnimationFrame');
  results.push({
    name: 'requestAnimationFrame机制',
    status: usesRAF ? 'pass' : 'fail',
    message: usesRAF ? '已使用requestAnimationFrame' : '未使用requestAnimationFrame'
  });
  
  // 检查点3：移除setTimeout
  const hasSetTimeoutInFilter = canvasEditorContent.match(/setTimeout\s*\(\s*\(\)\s*=>\s*{[\s\S]*?putImageData/);
  results.push({
    name: '移除滤镜处理中的setTimeout',
    status: !hasSetTimeoutInFilter ? 'pass' : 'fail',
    message: !hasSetTimeoutInFilter ? '已移除setTimeout' : '仍使用setTimeout'
  });
  
  // 检查点4：强制刷新方法
  const hasForceRefresh = canvasEditorContent.includes('forceCanvasRefresh');
  results.push({
    name: 'Canvas强制刷新方法',
    status: hasForceRefresh ? 'pass' : 'fail',
    message: hasForceRefresh ? '已添加强制刷新方法' : '缺少强制刷新方法'
  });
  
  // 检查点5：状态防护
  const hasStateGuard = canvasEditorContent.includes('if (this.data.isProcessingFilter');
  results.push({
    name: '滤镜处理状态防护',
    status: hasStateGuard ? 'pass' : 'fail',
    message: hasStateGuard ? '已添加状态防护' : '缺少状态防护'
  });
  
  // 检查页面编辑器文件
  const pageEditorPath = path.resolve(__dirname, '../miniprogram/pages/image-editor/image-editor.js');
  
  if (fs.existsSync(pageEditorPath)) {
    const pageEditorContent = fs.readFileSync(pageEditorPath, 'utf8');
    
    // 检查点6：防抖处理
    const hasDebounce = pageEditorContent.includes('opacityDebounceTimer');
    results.push({
      name: '透明度调节防抖处理',
      status: hasDebounce ? 'pass' : 'fail',
      message: hasDebounce ? '已添加防抖处理' : '缺少防抖处理'
    });
    
    // 检查点7：实时模式管理
    const hasRealtimeMode = pageEditorContent.includes('setRealtimeMode');
    results.push({
      name: '实时模式管理',
      status: hasRealtimeMode ? 'pass' : 'fail',
      message: hasRealtimeMode ? '已添加实时模式管理' : '缺少实时模式管理'
    });
  }
  
  return results;
}

// 检查测试文件
function checkTestFiles() {
  const results = [];
  
  const testFiles = [
    'unit/canvas-editor-filter.test.js',
    'integration/filter-integration.test.js',
    'fixtures/filter-test-page.html',
    'jest.config.js',
    'setup.js'
  ];
  
  testFiles.forEach(file => {
    const filePath = path.resolve(__dirname, file);
    const exists = fs.existsSync(filePath);
    results.push({
      name: `测试文件: ${file}`,
      status: exists ? 'pass' : 'fail',
      message: exists ? '文件存在' : '文件缺失'
    });
  });
  
  return results;
}

// 代码质量检查
function checkCodeQuality() {
  const results = [];
  
  const canvasEditorPath = path.resolve(__dirname, '../miniprogram/components/canvas-editor/canvas-editor.js');
  
  if (fs.existsSync(canvasEditorPath)) {
    const content = fs.readFileSync(canvasEditorPath, 'utf8');
    
    // 检查错误处理
    const hasTryCatch = content.includes('try {') && content.includes('catch (error)');
    results.push({
      name: '错误处理机制',
      status: hasTryCatch ? 'pass' : 'fail',
      message: hasTryCatch ? '包含错误处理' : '缺少错误处理'
    });
    
    // 检查状态清理
    const hasStateCleanup = content.includes('isProcessingFilter: false') && 
                           content.includes('filterProcessingType: null');
    results.push({
      name: '状态清理机制',
      status: hasStateCleanup ? 'pass' : 'fail',
      message: hasStateCleanup ? '包含状态清理' : '缺少状态清理'
    });
    
    // 检查注释质量
    const commentLines = content.split('\n').filter(line => line.trim().startsWith('//')).length;
    const totalLines = content.split('\n').length;
    const commentRatio = commentLines / totalLines;
    
    results.push({
      name: '代码注释覆盖率',
      status: commentRatio > 0.1 ? 'pass' : 'warn',
      message: `注释覆盖率: ${(commentRatio * 100).toFixed(1)}%`
    });
  }
  
  return results;
}

// 生成验证报告
function generateReport(fixResults, testResults, qualityResults) {
  console.log('');
  colorLog('bright', '🔍 滤镜修复验证报告');
  console.log('='.repeat(50));
  
  // 修复点检查
  console.log('');
  colorLog('blue', '📋 修复点检查');
  console.log('-'.repeat(30));
  
  let passCount = 0;
  let totalCount = fixResults.length;
  
  fixResults.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : '❌';
    const color = result.status === 'pass' ? 'green' : 'red';
    console.log(`${icon} ${result.name}`);
    colorLog(color, `   ${result.message}`);
    if (result.status === 'pass') passCount++;
  });
  
  console.log('');
  colorLog('cyan', `修复完成度: ${passCount}/${totalCount} (${(passCount/totalCount*100).toFixed(1)}%)`);
  
  // 测试文件检查
  console.log('');
  colorLog('blue', '🧪 测试文件检查');
  console.log('-'.repeat(30));
  
  let testPassCount = 0;
  let testTotalCount = testResults.length;
  
  testResults.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : '❌';
    const color = result.status === 'pass' ? 'green' : 'red';
    console.log(`${icon} ${result.name}`);
    if (result.status === 'pass') testPassCount++;
  });
  
  console.log('');
  colorLog('cyan', `测试文件完整度: ${testPassCount}/${testTotalCount} (${(testPassCount/testTotalCount*100).toFixed(1)}%)`);
  
  // 代码质量检查
  console.log('');
  colorLog('blue', '⚡ 代码质量检查');
  console.log('-'.repeat(30));
  
  qualityResults.forEach(result => {
    let icon, color;
    switch(result.status) {
      case 'pass': icon = '✅'; color = 'green'; break;
      case 'warn': icon = '⚠️'; color = 'yellow'; break;
      default: icon = '❌'; color = 'red'; break;
    }
    console.log(`${icon} ${result.name}`);
    colorLog(color, `   ${result.message}`);
  });
  
  // 总体评估
  console.log('');
  colorLog('blue', '📊 总体评估');
  console.log('-'.repeat(30));
  
  const overallScore = (passCount + testPassCount) / (totalCount + testTotalCount) * 100;
  
  if (overallScore >= 90) {
    colorLog('green', '🎉 修复质量: 优秀');
    colorLog('green', '✅ 滤镜闪烁问题修复完成，可以进行测试验证');
  } else if (overallScore >= 70) {
    colorLog('yellow', '⚠️  修复质量: 良好');
    colorLog('yellow', '💡 建议完善剩余修复点后再进行测试');
  } else {
    colorLog('red', '❌ 修复质量: 需要改进');
    colorLog('red', '🔧 请完成必要的修复点后再进行验证');
  }
  
  console.log('');
  colorLog('cyan', `总体完成度: ${overallScore.toFixed(1)}%`);
  
  // 下一步建议
  console.log('');
  colorLog('blue', '🚀 下一步建议');
  console.log('-'.repeat(30));
  
  if (overallScore >= 90) {
    console.log('1. 运行单元测试: cd tests && npm run test:unit');
    console.log('2. 运行集成测试: cd tests && npm run test:integration');
    console.log('3. 在真实设备上测试滤镜功能');
    console.log('4. 检查性能和内存使用情况');
  } else {
    const failedFixes = fixResults.filter(r => r.status === 'fail');
    if (failedFixes.length > 0) {
      console.log('请完成以下修复点:');
      failedFixes.forEach(fix => {
        console.log(`- ${fix.name}: ${fix.message}`);
      });
    }
    
    const missingTests = testResults.filter(r => r.status === 'fail');
    if (missingTests.length > 0) {
      console.log('请创建缺失的测试文件:');
      missingTests.forEach(test => {
        console.log(`- ${test.name}`);
      });
    }
  }
  
  console.log('');
}

// 主函数
function main() {
  colorLog('bright', '🔍 开始验证滤镜修复效果...');
  
  try {
    const fixResults = checkFixPoints();
    const testResults = checkTestFiles();
    const qualityResults = checkCodeQuality();
    
    generateReport(fixResults, testResults, qualityResults);
    
  } catch (error) {
    colorLog('red', `❌ 验证过程出错: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  checkFixPoints,
  checkTestFiles,
  checkCodeQuality
};
