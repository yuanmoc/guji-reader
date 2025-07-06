import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', {
  state: () => ({
    // 配置项
    baseURL: localStorage.getItem('baseURL') || '',
    apiKey: localStorage.getItem('apiKey') || '',
    modelName: localStorage.getItem('modelName') || '',
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
    setConfig({ baseURL, apiKey, modelName }) {
      this.baseURL = baseURL;
      this.apiKey = apiKey;
      this.modelName = modelName;
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