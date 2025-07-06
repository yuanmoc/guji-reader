import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', {
  state: () => ({
    // 配置项
    baseURL: localStorage.getItem('baseURL') || 'http://127.0.0.1:9997/v1',
    apiKey: localStorage.getItem('apiKey') || '',
    modelName: localStorage.getItem('modelName') || 'qwen2.5-vl-instruct',
    fetchTranslationPrompt: localStorage.getItem('fetchTranslationPrompt') || 
    `请对以下提供的古籍图片执行OCR(光学字符识别)任务，并将识别出的文本转换为简体中文。输出时请务必注意：
1.  保留原始格式:严格依照图片中的段落换行、卷/章节标题层级、正文缩进等原始排版结构，不要自行合并或拆分段落（除非原始排版就是连续不分段）。
2.  处理特殊元素:
- 竖排文本：如果图片内容是竖排古籍，请按列识别并按阅读顺序（通常从右至左，从上至下）组织文本，并在输出中使用换行符表示列的结束，自动将竖排转为横排输出。
- 印章/图章：如文字区域内有明显印章或图章，识别后请用【印章】或【图章】标注其位置（例如：“【此处有印章】”），不要尝试识别印章文字（除非清晰可辨且你特别要求）。
- 破损/模糊文字：对完全无法识别的模糊或缺失文字，联想出符合的文字内容。
- 批注/旁注：区分主文与旁注/小字批注。如有明确位置关联，可用括号（）或特殊标记注明（如“正文内容[旁注内容]”）。
3.  精确转换语言: 
- 原始图片内容如为繁体字/异体字/古汉字，务必转换为对应的现代标准简体中文。
- 避免引入任何图片中没有的现代标点（如书名号、引号），除非是分隔明确句子的句读（、。等）原文已有。
4.  纯文本输出：最终输出结果应为纯净的文本,只包含识别和转换后的文字以及必要的格式符(换行、空格)。不要添加任何额外的分析、说明(如“这是第X页内容:”)或标记(如页面编号)。
`,
    explainPrompt: localStorage.getItem('explainPrompt') || '你是一位古籍研究专家，请用现代汉语解释以下古文内容：',
    // PDF 文件与页面状态
    pdfFile: null,
    pdfPages: 0,
    currentPage: 1,
    scale: 0.8,
    // 模型识别缓存 - 基于文件名称和页码的二维结构
    translationCache: JSON.parse(localStorage.getItem('translationCache') || '{}'),
    // 上次文件状态（用于恢复）
    lastFileInfo: JSON.parse(localStorage.getItem('lastFileInfo') || 'null'),
  }),
  actions: {
    setConfig({ baseURL, apiKey, modelName, fetchTranslationPrompt, explainPrompt }) {
      this.baseURL = baseURL;
      this.apiKey = apiKey;
      this.modelName = modelName;
      this.fetchTranslationPrompt = fetchTranslationPrompt;
      this.explainPrompt = explainPrompt;
      localStorage.setItem('fetchTranslationPrompt', fetchTranslationPrompt);
      localStorage.setItem('explainPrompt', explainPrompt);
      localStorage.setItem('baseURL', baseURL);
      localStorage.setItem('apiKey', apiKey);
      localStorage.setItem('modelName', modelName);
    },
    setPdfFile(file) {
      this.pdfFile = file;
      // 保存文件信息用于下次恢复
      if (file) {
        this.lastFileInfo = {
          name: file.name,
          size: file.size,
          lastModified: file.lastModified,
          currentPage: this.currentPage,
          scale: this.scale,
          timestamp: Date.now()
        };
        localStorage.setItem('lastFileInfo', JSON.stringify(this.lastFileInfo));
      }
    },
    setPdfPages(pages) {
      this.pdfPages = pages;
    },
    setCurrentPage(page) {
      this.currentPage = page;
      // 更新保存的文件信息中的当前页面
      if (this.lastFileInfo) {
        this.lastFileInfo.currentPage = page;
        localStorage.setItem('lastFileInfo', JSON.stringify(this.lastFileInfo));
      }
    },
    setScale(scale) {
      this.scale = scale;
      // 更新保存的文件信息中的缩放比例
      if (this.lastFileInfo) {
        this.lastFileInfo.scale = scale;
        localStorage.setItem('lastFileInfo', JSON.stringify(this.lastFileInfo));
      }
    },
    // 缓存模型识别结果 - 基于文件名称和页码
    cacheTranslation(fileName, page, result) {
      if (!this.translationCache[fileName]) {
        this.translationCache[fileName] = {};
      }
      this.translationCache[fileName][page] = result;
      // 持久化到localStorage
      localStorage.setItem('translationCache', JSON.stringify(this.translationCache));
    },
    // 获取模型识别缓存 - 基于文件名称和页码
    getTranslationCache(fileName, page) {
      return this.translationCache[fileName]?.[page] || null;
    },
    // 获取当前文件的模型识别缓存
    getCurrentFileCache() {
      if (!this.pdfFile) return {};
      return this.translationCache[this.pdfFile.name] || {};
    },
    // 清除指定文件的模型识别缓存
    clearFileCache(fileName) {
      if (this.translationCache[fileName]) {
        delete this.translationCache[fileName];
        localStorage.setItem('translationCache', JSON.stringify(this.translationCache));
      }
    },
    // 检查是否有上次的文件信息
    hasLastFileInfo() {
      return !!this.lastFileInfo;
    },
    // 获取上次文件信息
    getLastFileInfo() {
      return this.lastFileInfo;
    }
  },
}); 