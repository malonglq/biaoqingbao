// 通用图片上传工具函数
// 支持微信小程序的图片选择、压缩、验证和上传功能

const { showToast, showLoading, hideLoading } = require('./common.js');

/**
 * 默认上传配置
 */
const DEFAULT_CONFIG = {
  count: 1,                                    // 最多选择图片数量
  sizeType: ['compressed'],                    // 图片质量：original(原图), compressed(压缩图)
  sourceType: ['album', 'camera'],             // 图片来源：album(相册), camera(相机)
  maxSize: 5 * 1024 * 1024,                   // 最大文件大小(5MB)
  allowedFormats: ['jpg', 'jpeg', 'png'],      // 允许的图片格式
  maxWidth: 5000,                             // 最大宽度(px) - 支持大尺寸图片
  maxHeight: 5000,                            // 最大高度(px) - 支持大尺寸图片
  quality: 0.8,                               // 压缩质量(0-1)
  uploadUrl: '',                              // 上传接口地址(可选)
  onProgress: null,                           // 进度回调函数
  onSuccess: null,                            // 成功回调函数
  onError: null                               // 错误回调函数
};

/**
 * 获取图片文件扩展名
 * @param {String} filePath - 文件路径
 * @returns {String} - 文件扩展名
 */
function getFileExtension(filePath) {
  const lastDotIndex = filePath.lastIndexOf('.');
  if (lastDotIndex === -1) return '';
  return filePath.substring(lastDotIndex + 1).toLowerCase();
}

/**
 * 验证图片格式
 * @param {String} filePath - 图片路径
 * @param {Array} allowedFormats - 允许的格式数组
 * @returns {Boolean} - 是否为允许的格式
 */
function validateImageFormat(filePath, allowedFormats) {
  const extension = getFileExtension(filePath);
  return allowedFormats.includes(extension);
}

/**
 * 获取图片信息
 * @param {String} src - 图片路径
 * @returns {Promise} - 返回图片信息
 */
function getImageInfo(src) {
  return new Promise((resolve, reject) => {
    wx.getImageInfo({
      src,
      success: resolve,
      fail: reject
    });
  });
}

/**
 * 压缩图片
 * @param {String} src - 图片路径
 * @param {Number} quality - 压缩质量(0-1)
 * @returns {Promise} - 返回压缩后的图片路径
 */
function compressImage(src, quality = 0.8) {
  return new Promise((resolve, reject) => {
    wx.compressImage({
      src,
      quality: Math.floor(quality * 100), // 微信API需要0-100的整数
      success: (res) => resolve(res.tempFilePath),
      fail: reject
    });
  });
}

/**
 * 验证图片尺寸
 * @param {Object} imageInfo - 图片信息
 * @param {Number} maxWidth - 最大宽度
 * @param {Number} maxHeight - 最大高度
 * @returns {Boolean} - 是否符合尺寸要求
 */
function validateImageSize(imageInfo, maxWidth, maxHeight) {
  const { width, height } = imageInfo;
  return width <= maxWidth && height <= maxHeight;
}

/**
 * 选择图片
 * @param {Object} config - 配置参数
 * @returns {Promise} - 返回选择的图片数组
 */
function chooseImages(config) {
  return new Promise((resolve, reject) => {
    wx.chooseImage({
      count: config.count,
      sizeType: config.sizeType,
      sourceType: config.sourceType,
      success: resolve,
      fail: reject
    });
  });
}

/**
 * 处理单张图片
 * @param {String} tempFilePath - 临时文件路径
 * @param {Object} config - 配置参数
 * @returns {Promise} - 返回处理后的图片信息
 */
async function processSingleImage(tempFilePath, config) {
  try {
    // 1. 验证图片格式
    if (!validateImageFormat(tempFilePath, config.allowedFormats)) {
      throw new Error(`不支持的图片格式，请选择 ${config.allowedFormats.join('、')} 格式的图片`);
    }

    // 2. 获取图片信息
    const imageInfo = await getImageInfo(tempFilePath);
    
    // 3. 验证文件大小
    if (imageInfo.size && imageInfo.size > config.maxSize) {
      throw new Error(`图片文件过大，请选择小于 ${Math.floor(config.maxSize / 1024 / 1024)}MB 的图片`);
    }

    // 4. 验证图片尺寸
    if (!validateImageSize(imageInfo, config.maxWidth, config.maxHeight)) {
      throw new Error(`图片尺寸过大，请选择 ${config.maxWidth}x${config.maxHeight} 以内的图片`);
    }

    // 5. 压缩图片
    let finalPath = tempFilePath;
    if (config.quality < 1) {
      try {
        finalPath = await compressImage(tempFilePath, config.quality);
      } catch (compressError) {
        console.warn('图片压缩失败，使用原图:', compressError);
        // 压缩失败时使用原图
      }
    }

    return {
      success: true,
      tempFilePath: finalPath,
      originalPath: tempFilePath,
      width: imageInfo.width,
      height: imageInfo.height,
      size: imageInfo.size || 0,
      type: getFileExtension(tempFilePath)
    };

  } catch (error) {
    return {
      success: false,
      error: error.message || '图片处理失败'
    };
  }
}

/**
 * 模拟上传图片到服务器
 * @param {String} filePath - 图片文件路径
 * @param {String} uploadUrl - 上传地址
 * @param {Function} onProgress - 进度回调
 * @returns {Promise} - 返回上传结果
 */
function uploadToServer(filePath, uploadUrl, onProgress) {
  return new Promise((resolve, reject) => {
    if (!uploadUrl) {
      // 如果没有上传地址，直接返回本地路径（用于演示）
      resolve({
        success: true,
        url: filePath,
        message: '图片选择成功（演示模式）'
      });
      return;
    }

    const uploadTask = wx.uploadFile({
      url: uploadUrl,
      filePath,
      name: 'image',
      header: {
        'Content-Type': 'multipart/form-data'
      },
      success: (res) => {
        try {
          const data = JSON.parse(res.data);
          if (data.success) {
            resolve({
              success: true,
              url: data.url,
              message: '上传成功'
            });
          } else {
            reject(new Error(data.message || '上传失败'));
          }
        } catch (parseError) {
          reject(new Error('服务器响应格式错误'));
        }
      },
      fail: (error) => {
        reject(new Error(error.errMsg || '网络错误，上传失败'));
      }
    });

    // 监听上传进度
    if (onProgress && typeof onProgress === 'function') {
      uploadTask.onProgressUpdate((res) => {
        onProgress(res.progress);
      });
    }
  });
}

/**
 * 主要的图片上传函数
 * @param {Object} options - 配置选项
 * @returns {Promise} - 返回上传结果
 */
async function uploadImages(options = {}) {
  // 合并配置
  const config = { ...DEFAULT_CONFIG, ...options };

  try {
    // 显示加载提示
    showLoading('选择图片中...');

    // 1. 选择图片
    const chooseResult = await chooseImages(config);
    const { tempFilePaths } = chooseResult;

    if (!tempFilePaths || tempFilePaths.length === 0) {
      hideLoading();
      return {
        success: false,
        error: '未选择任何图片',
        cancelled: false
      };
    }

    hideLoading();
    showLoading('处理图片中...');

    // 2. 处理所有选择的图片
    const processPromises = tempFilePaths.map(path => 
      processSingleImage(path, config)
    );
    const processResults = await Promise.all(processPromises);

    // 3. 检查处理结果
    const failedResults = processResults.filter(result => !result.success);
    if (failedResults.length > 0) {
      hideLoading();
      const errorMessage = failedResults[0].error;
      showToast(errorMessage, 'none');
      return {
        success: false,
        error: errorMessage
      };
    }

    // 4. 上传图片（如果配置了上传地址）
    const successResults = processResults.filter(result => result.success);
    const uploadPromises = successResults.map(result => 
      uploadToServer(result.tempFilePath, config.uploadUrl, config.onProgress)
    );

    showLoading('上传图片中...');
    const uploadResults = await Promise.all(uploadPromises);
    hideLoading();

    // 5. 处理上传结果
    const failedUploads = uploadResults.filter(result => !result.success);
    if (failedUploads.length > 0) {
      const errorMessage = failedUploads[0].message || '上传失败';
      showToast(errorMessage, 'none');
      return {
        success: false,
        error: errorMessage
      };
    }

    // 6. 返回成功结果
    const finalResults = successResults.map((processResult, index) => ({
      ...processResult,
      uploadUrl: uploadResults[index].url,
      uploadMessage: uploadResults[index].message
    }));

    // 调用成功回调
    if (config.onSuccess && typeof config.onSuccess === 'function') {
      config.onSuccess(finalResults);
    }

    showToast('图片上传成功！', 'success');
    
    return {
      success: true,
      images: finalResults,
      message: '图片上传成功'
    };

  } catch (error) {
    hideLoading();

    // 检查是否为用户取消操作
    const isCancelled = error.errMsg && error.errMsg.includes('cancel');

    if (isCancelled) {
      // 用户取消操作，不显示错误提示
      console.log('用户取消了图片选择');
      return {
        success: false,
        error: '用户取消选择',
        cancelled: true
      };
    }

    // 检查是否为权限问题
    const isPermissionDenied = error.errMsg && (
      error.errMsg.includes('permission') ||
      error.errMsg.includes('authorize') ||
      error.errMsg.includes('denied')
    );

    if (isPermissionDenied) {
      const permissionMessage = '请授权访问相册和相机权限';
      showToast(permissionMessage, 'none');
      return {
        success: false,
        error: permissionMessage,
        cancelled: false,
        permissionDenied: true
      };
    }

    // 真正的错误处理
    const errorMessage = error.message || error.errMsg || '图片上传失败';

    // 调用错误回调
    if (config.onError && typeof config.onError === 'function') {
      config.onError(error);
    }

    showToast(errorMessage, 'none');

    return {
      success: false,
      error: errorMessage,
      cancelled: false
    };
  }
}

/**
 * 预设配置：身体素材上传
 */
const BODY_UPLOAD_CONFIG = {
  count: 1,
  maxWidth: 5000,  // 增加到5000px，支持大尺寸图片
  maxHeight: 5000, // 增加到5000px，支持大尺寸图片
  quality: 0.8,
  allowedFormats: ['jpg', 'jpeg', 'png'],
  maxSize: 5 * 1024 * 1024 // 增加到5MB以支持大尺寸图片
};

/**
 * 预设配置：表情素材上传
 */
const EXPRESSION_UPLOAD_CONFIG = {
  count: 1,
  maxWidth: 5000,  // 增加到5000px，支持大尺寸图片
  maxHeight: 5000, // 增加到5000px，支持大尺寸图片
  quality: 0.9,
  allowedFormats: ['jpg', 'jpeg', 'png'],
  maxSize: 5 * 1024 * 1024 // 增加到5MB以支持大尺寸图片
};

module.exports = {
  uploadImages,
  BODY_UPLOAD_CONFIG,
  EXPRESSION_UPLOAD_CONFIG,
  DEFAULT_CONFIG
};
