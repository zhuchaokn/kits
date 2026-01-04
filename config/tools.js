/**
 * 小工具工厂 - 工具配置
 * 精简版：只包含4个核心工具
 */

// 工具分类
export const categories = [
  { id: 'all', name: '全部', icon: 'app' },
  { id: 'image', name: '图片工具', icon: 'image' },
  { id: 'video', name: '视频工具', icon: 'video' },
  { id: 'document', name: '文档工具', icon: 'file' },
];

// 工具列表
export const tools = [
  {
    id: 'image-collage',
    name: '图片拼接',
    desc: '多图拼接，支持横向、竖向、宫格',
    icon: 'image',
    category: 'image',
    color: '#14B8A6',
    bgColor: '#F0FDFA',
    path: '/pages/tools/image-collage/index',
    hot: true,
  },
  {
    id: 'image-watermark',
    name: '图片加水印',
    desc: '为图片添加文字或图片水印',
    icon: 'logo-wechat-stroke',
    category: 'image',
    color: '#10B981',
    bgColor: '#ECFDF5',
    path: '/pages/tools/image-watermark/index',
    hot: true,
  },
  {
    id: 'video-to-audio',
    name: '视频提取音频',
    desc: '从视频中提取音频，支持聊天记录视频',
    icon: 'sound',
    category: 'video',
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
    path: '/pages/tools/video-to-audio/index',
    hot: true,
  },
];

// 获取热门工具
export const getHotTools = () => tools.filter((tool) => tool.hot);

// 根据分类获取工具
export const getToolsByCategory = (categoryId) => {
  if (categoryId === 'all') return tools;
  return tools.filter((tool) => tool.category === categoryId);
};

// 根据ID获取工具
export const getToolById = (id) => tools.find((tool) => tool.id === id);

// 搜索工具
export const searchTools = (keyword) => {
  if (!keyword) return tools;
  const lowerKeyword = keyword.toLowerCase();
  return tools.filter(
    (tool) =>
      tool.name.toLowerCase().includes(lowerKeyword) ||
      tool.desc.toLowerCase().includes(lowerKeyword)
  );
};

export default {
  categories,
  tools,
  getHotTools,
  getToolsByCategory,
  getToolById,
  searchTools,
};
