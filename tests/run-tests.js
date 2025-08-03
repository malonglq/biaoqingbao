#!/usr/bin/env node
// run-tests.js - 测试运行脚本

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 检查依赖
function checkDependencies() {
  colorLog('blue', '🔍 检查测试依赖...');
  
  const requiredPackages = [
    'jest',
    'puppeteer',
    '@babel/core',
    '@babel/preset-env',
    'babel-jest'
  ];
  
  const packageJsonPath = path.resolve(__dirname, '../package.json');
  let packageJson = {};
  
  try {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  } catch (error) {
    colorLog('yellow', '⚠️  package.json不存在，创建基础配置...');
    packageJson = {
      name: 'miniprogram-filter-tests',
      version: '1.0.0',
      scripts: {},
      devDependencies: {}
    };
  }
  
  const missingPackages = requiredPackages.filter(pkg => 
    !packageJson.dependencies?.[pkg] && !packageJson.devDependencies?.[pkg]
  );
  
  if (missingPackages.length > 0) {
    colorLog('yellow', `⚠️  缺少依赖包: ${missingPackages.join(', ')}`);
    colorLog('cyan', '💡 请运行以下命令安装依赖:');
    console.log(`npm install --save-dev ${missingPackages.join(' ')}`);
    return false;
  }
  
  colorLog('green', '✅ 所有依赖已安装');
  return true;
}

// 创建Babel配置
function createBabelConfig() {
  const babelConfigPath = path.resolve(__dirname, '../babel.config.js');
  
  if (!fs.existsSync(babelConfigPath)) {
    colorLog('blue', '📝 创建Babel配置...');
    
    const babelConfig = `module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        node: 'current'
      }
    }]
  ]
};`;
    
    fs.writeFileSync(babelConfigPath, babelConfig);
    colorLog('green', '✅ Babel配置已创建');
  }
}

// 运行单元测试
function runUnitTests() {
  return new Promise((resolve, reject) => {
    colorLog('blue', '🧪 运行单元测试...');
    
    const jestArgs = [
      '--config', path.resolve(__dirname, 'jest.config.js'),
      '--testPathPattern=unit',
      '--verbose',
      '--coverage'
    ];
    
    const jest = spawn('npx', ['jest', ...jestArgs], {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..')
    });
    
    jest.on('close', (code) => {
      if (code === 0) {
        colorLog('green', '✅ 单元测试通过');
        resolve();
      } else {
        colorLog('red', '❌ 单元测试失败');
        reject(new Error(`单元测试失败，退出码: ${code}`));
      }
    });
    
    jest.on('error', (error) => {
      colorLog('red', `❌ 单元测试运行错误: ${error.message}`);
      reject(error);
    });
  });
}

// 运行集成测试
function runIntegrationTests() {
  return new Promise((resolve, reject) => {
    colorLog('blue', '🔗 运行集成测试...');
    
    const jestArgs = [
      '--config', path.resolve(__dirname, 'jest.config.js'),
      '--testPathPattern=integration',
      '--verbose',
      '--runInBand' // 串行运行，避免Puppeteer冲突
    ];
    
    const jest = spawn('npx', ['jest', ...jestArgs], {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..')
    });
    
    jest.on('close', (code) => {
      if (code === 0) {
        colorLog('green', '✅ 集成测试通过');
        resolve();
      } else {
        colorLog('red', '❌ 集成测试失败');
        reject(new Error(`集成测试失败，退出码: ${code}`));
      }
    });
    
    jest.on('error', (error) => {
      colorLog('red', `❌ 集成测试运行错误: ${error.message}`);
      reject(error);
    });
  });
}

// 生成测试报告
function generateReport() {
  colorLog('blue', '📊 生成测试报告...');
  
  const coverageDir = path.resolve(__dirname, 'coverage');
  const reportPath = path.resolve(coverageDir, 'lcov-report/index.html');
  
  if (fs.existsSync(reportPath)) {
    colorLog('green', `✅ 测试报告已生成: ${reportPath}`);
    colorLog('cyan', '💡 在浏览器中打开查看详细覆盖率报告');
  } else {
    colorLog('yellow', '⚠️  测试报告生成失败');
  }
}

// 主函数
async function main() {
  try {
    colorLog('bright', '🚀 开始运行滤镜功能测试套件');
    console.log('');
    
    // 检查依赖
    if (!checkDependencies()) {
      process.exit(1);
    }
    
    // 创建配置文件
    createBabelConfig();
    
    console.log('');
    
    // 运行测试
    const testType = process.argv[2];
    
    if (testType === 'unit' || !testType) {
      await runUnitTests();
    }
    
    if (testType === 'integration' || !testType) {
      console.log('');
      await runIntegrationTests();
    }
    
    console.log('');
    
    // 生成报告
    generateReport();
    
    console.log('');
    colorLog('green', '🎉 所有测试完成！');
    
  } catch (error) {
    console.log('');
    colorLog('red', `❌ 测试失败: ${error.message}`);
    process.exit(1);
  }
}

// 处理命令行参数
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
${colors.bright}滤镜功能测试套件${colors.reset}

用法:
  node run-tests.js [test-type] [options]

测试类型:
  unit         只运行单元测试
  integration  只运行集成测试
  (无参数)      运行所有测试

选项:
  --help, -h   显示帮助信息

示例:
  node run-tests.js           # 运行所有测试
  node run-tests.js unit      # 只运行单元测试
  node run-tests.js integration # 只运行集成测试
`);
    process.exit(0);
  }
  
  main();
}

module.exports = {
  runUnitTests,
  runIntegrationTests,
  generateReport
};
