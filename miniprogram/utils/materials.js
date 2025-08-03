// 素材数据管理 - 转换自原HTML的素材数据
const materials = {
  // 身体素材分类
  panda: ['🐼', '🐾', '🎋', '🎍', '🍃', '🌿', '🌱', '🌾', '🎄', '🌲', '🌳', '🌴', '🌵', '🌶️', '🥒'],
  mushroom: ['🍄', '🟫', '🟤', '🤎', '🟠', '🟡', '🟢', '🔵', '🟣', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪'],
  round: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍'],
  rabbit: ['🐰', '🐇', '🥕', '🌸', '🌺', '🌻', '🌷', '🌹', '💐', '🌼', '🌾', '🍀', '🌿', '🌱', '🌳'],
  dark: ['😈', '👿', '💀', '☠️', '👻', '👽', '👾', '🤖', '💩', '😡', '🤬', '😠', '👹', '👺', '🔥'],
  comic: ['💥', '💫', '⭐', '🌟', '✨', '⚡', '🔥', '💢', '💨', '💦', '💧', '🌈', '☀️', '🌙', '⭐']
};

// 表情素材分类
const expressions = {
  happy: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😋', '😎', '🤩', '🥳'],
  sad: ['😢', '😭', '😿', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😪', '😴', '😵', '🤧', '🤒', '🤕'],
  angry: ['😠', '😡', '🤬', '😤', '👿', '💢', '🔥', '💥', '⚡', '👹', '👺', '😈', '🤯', '😵', '🥵', '😾', '🙄', '😒', '😮‍💨', '💀'],
  love: ['😍', '🥰', '😘', '😗', '😙', '😚', '💕', '💖', '💗', '💘', '💝', '💞', '💟', '❤️', '🧡', '💛', '💚', '💙', '💜', '🤍'],
  surprise: ['😲', '😱', '🤯', '😵', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😜', '😝', '😛', '🤤', '🤭', '🫢', '🫣', '🤫', '🤗']
};

// 分类名称映射（中文到英文）
const categoryMap = {
  // 身体分类
  '熊猫': 'panda',
  '蘑菇头': 'mushroom',
  '圆脸': 'round',
  '兔子': 'rabbit',
  '黑暗势力': 'dark',
  '漫画': 'comic',
  
  // 表情分类
  '开心': 'happy',
  '难过': 'sad',
  '愤怒': 'angry',
  '爱心': 'love',
  '惊讶': 'surprise'
};

// 分类显示名称映射（英文到中文）
const categoryDisplayMap = {
  // 身体分类
  'panda': '熊猫',
  'mushroom': '蘑菇头',
  'round': '圆脸',
  'rabbit': '兔子',
  'dark': '黑暗势力',
  'comic': '漫画',
  
  // 表情分类
  'happy': '开心',
  'sad': '难过',
  'angry': '愤怒',
  'love': '爱心',
  'surprise': '惊讶'
};

// 获取指定分类的素材列表
function getMaterials(type, category) {
  if (type === 'body') {
    return materials[category] || materials.panda;
  } else if (type === 'expression') {
    return expressions[category] || expressions.happy;
  }
  return [];
}

// 获取分类的英文key
function getCategoryKey(displayName) {
  return categoryMap[displayName] || displayName;
}

// 获取分类的显示名称
function getCategoryDisplayName(key) {
  return categoryDisplayMap[key] || key;
}

// 获取所有身体分类
function getBodyCategories() {
  return Object.keys(materials).map(key => ({
    key,
    displayName: getCategoryDisplayName(key)
  }));
}

// 获取所有表情分类
function getExpressionCategories() {
  return Object.keys(expressions).map(key => ({
    key,
    displayName: getCategoryDisplayName(key)
  }));
}

module.exports = {
  materials,
  expressions,
  categoryMap,
  categoryDisplayMap,
  getMaterials,
  getCategoryKey,
  getCategoryDisplayName,
  getBodyCategories,
  getExpressionCategories
};
