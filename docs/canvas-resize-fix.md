# Canvas尺寸动态调整修复方案

## 问题描述

用户反馈：黑白滤镜处理后的图片只有一小半，尺寸发生了变化。

**根本原因**：Canvas尺寸固定为300x300，而图片尺寸为4096x3072，导致图片被严重压缩，滤镜只能在小Canvas上生效。

## 解决方案

### 1. 动态Canvas尺寸调整

**新增方法**：`resizeCanvasForImage(image)`

```javascript
async resizeCanvasForImage(image) {
  // 微信小程序Canvas最大尺寸限制：1365x1365
  const maxCanvasSize = 1365;
  const dpr = wx.getSystemInfoSync().pixelRatio || 1;
  
  // 计算合适的Canvas尺寸
  let canvasWidth = image.width;
  let canvasHeight = image.height;
  
  // 如果图片太大，按比例缩小到最大尺寸
  if (canvasWidth > maxCanvasSize || canvasHeight > maxCanvasSize) {
    const scale = Math.min(maxCanvasSize / canvasWidth, maxCanvasSize / canvasHeight);
    canvasWidth = Math.floor(canvasWidth * scale);
    canvasHeight = Math.floor(canvasHeight * scale);
  }
  
  // 设置Canvas实际像素尺寸
  mainCanvas.width = canvasWidth * dpr;
  mainCanvas.height = canvasHeight * dpr;
  offscreenCanvas.width = canvasWidth * dpr;
  offscreenCanvas.height = canvasHeight * dpr;
  
  // 重新设置上下文缩放
  mainCtx.scale(dpr, dpr);
  offscreenCtx.scale(dpr, dpr);
}
```

### 2. 图片布局计算优化

**修改前**：复杂的比例计算和居中对齐
```javascript
// 旧版本：图片需要适应固定Canvas尺寸
if (imageAspect > canvasAspect) {
  scale = canvasWidth / image.width;
  offsetX = 0;
  offsetY = (canvasHeight - image.height * scale) / 2;
} else {
  scale = canvasHeight / image.height;
  offsetX = (canvasWidth - image.width * scale) / 2;
  offsetY = 0;
}
```

**修改后**：简化的1:1映射
```javascript
// 新版本：Canvas尺寸与图片尺寸匹配
const scale = canvasWidth / image.width;  // 通常为1或缩放比例
const offsetX = 0;
const offsetY = 0;
```

### 3. CSS样式适配

**添加响应式样式**：
```css
.main-canvas {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  touch-action: none;
  max-width: 100%;      /* 新增：限制最大宽度 */
  max-height: 100%;     /* 新增：限制最大高度 */
  object-fit: contain;  /* 新增：保持比例 */
}
```

## 技术细节

### 微信小程序Canvas限制

1. **最大尺寸**：1365 x 1365像素
2. **设备像素比**：需要考虑DPR进行缩放
3. **内存限制**：大尺寸Canvas消耗更多内存

### 处理策略

1. **优先保持原始尺寸**：如果图片尺寸在限制内，使用原始尺寸
2. **等比例缩放**：如果超出限制，按比例缩小到最大允许尺寸
3. **DPR适配**：考虑设备像素比，确保高分辨率设备显示清晰

### 示例计算

**原始图片**：4096 x 3072
**最大Canvas**：1365 x 1365
**缩放计算**：
```javascript
const scaleX = 1365 / 4096 = 0.333
const scaleY = 1365 / 3072 = 0.444
const finalScale = Math.min(scaleX, scaleY) = 0.333

最终Canvas尺寸：
width = 4096 * 0.333 = 1364
height = 3072 * 0.333 = 1023
```

## 预期效果

### 修复前
- Canvas：330 x 318
- 图片被严重压缩
- 滤镜只作用于小区域
- 图像质量损失严重

### 修复后
- Canvas：1364 x 1023（接近最大限制）
- 图片保持高分辨率
- 滤镜作用于完整图像
- 图像质量大幅提升

## 测试验证

### 测试步骤
1. 加载4096x3072的高分辨率图片
2. 应用黑白滤镜
3. 检查处理后的图像尺寸
4. 验证滤镜效果覆盖整个图像

### 预期日志
```
🔧 重新设置Canvas尺寸: {
  原始图片: { width: 4096, height: 3072 },
  Canvas尺寸: { width: 1364, height: 1023 },
  设备像素比: 3,
  实际像素: { width: 4092, height: 3069 }
}

🎨 获取到的图像数据: {
  width: 1364, 
  height: 1023, 
  dataLength: 5576144  // 1364 * 1023 * 4
}
```

## 性能考虑

### 内存使用
- **修复前**：330 * 318 * 4 = 419,760 字节 (~410KB)
- **修复后**：1364 * 1023 * 4 = 5,576,144 字节 (~5.3MB)

### 处理时间
- 更大的Canvas需要更多处理时间
- 但图像质量显著提升
- 对于图片编辑应用，这是必要的权衡

### 优化建议
1. **分辨率选项**：为性能较差的设备提供低分辨率选项
2. **渐进式处理**：对于超大图片，考虑分块处理
3. **内存监控**：监控内存使用，必要时降级处理

## 兼容性

### 支持的图片尺寸
- **小图片**：直接使用原始尺寸
- **中等图片**：1365x1365以内，直接使用
- **大图片**：等比例缩放到1365x1365以内

### 降级策略
- 如果Canvas创建失败，回退到图片预览模式
- 如果内存不足，自动降低分辨率

## 后续改进

1. **智能分辨率**：根据设备性能自动选择合适的分辨率
2. **WebGL支持**：对于复杂滤镜，考虑使用WebGL加速
3. **分块处理**：对于超大图片，实现分块处理算法
4. **缓存优化**：缓存处理结果，避免重复计算
