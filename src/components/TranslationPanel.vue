<template>
  <el-card class="translation-panel">
    <div v-if="!pdfFile" class="empty">请先选择PDF文件</div>
    <div v-else>
      <div class="toolbar">
        <el-button type="primary" :loading="loading" @click="translatePage">获取模型识别</el-button>
        <el-button v-if="error" type="danger" @click="translatePage">重试</el-button>
        <el-button v-if="hasCache" type="warning" @click="clearCurrentFileCache">清除缓存</el-button>
      </div>
      <div class="result-area">
        <div v-if="error" class="error">模型识别失败：{{ error }}</div>
        <div v-else-if="result">{{ result }}</div>
        <div v-else-if="loading">正在模型识别...</div>
        <div v-else class="tip">点击"获取模型识别"以查看当前页模型识别</div>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useAppStore } from '../stores/appStore';
import { fetchTranslation } from '../utils/api';
import { ElMessage, ElMessageBox } from 'element-plus';

const store = useAppStore();
const pdfFile = computed(() => store.pdfFile);
const currentPage = computed(() => store.currentPage);
const currentFileCache = computed(() => store.getCurrentFileCache());

const loading = ref(false);
const error = ref('');
const result = ref('');

// 检查当前文件是否有缓存
const hasCache = computed(() => {
  if (!pdfFile.value) return false;
  const cache = currentFileCache.value;
  return Object.keys(cache).length > 0;
});

// 监听文件或页面变化，自动回显缓存内容
watch([pdfFile, currentPage], ([file, page]) => {
  error.value = '';
  if (file && page) {
    const cachedResult = store.getTranslationCache(file.name, page);
    if (cachedResult) {
      result.value = cachedResult;
    } else {
      result.value = '';
    }
  } else {
    result.value = '';
  }
}, { immediate: true });

async function translatePage() {
  if (!pdfFile.value) return;
  error.value = '';
  result.value = '';
  loading.value = true;
  try {
    // 获取当前页图片base64
    const pageImageBase64 = await getCurrentPageImageBase64();
    const res = await fetchTranslation({
      baseURL: store.baseURL,
      apiKey: store.apiKey,
      modelName: store.modelName,
      pageImageBase64,
    });
    const text = res.choices?.[0]?.message?.content || '';
    if (text) {
      result.value = text;
      // 使用新的缓存方法，传入文件名称和页码
      store.cacheTranslation(pdfFile.value.name, currentPage.value, text);
    } else {
      throw new Error('无模型识别结果');
    }
  } catch (e) {
    error.value = e.message || '请求失败';
    ElMessage.error(error.value);
  } finally {
    loading.value = false;
  }
}

// 清除当前文件的模型识别缓存
async function clearCurrentFileCache() {
  if (!pdfFile.value) return;
  
  try {
    await ElMessageBox.confirm(
      `确定要清除文件"${pdfFile.value.name}"的所有模型识别缓存吗？`,
      '确认清除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    store.clearFileCache(pdfFile.value.name);
    result.value = '';
    ElMessage.success('缓存已清除');
  } catch (e) {
    // 用户取消操作
  }
}

// 获取当前页canvas转图片base64
async function getCurrentPageImageBase64() {
  const canvasContainer = document.querySelector('.canvas-container');
  const canvas = canvasContainer?.querySelector('canvas');
  if (!canvas) throw new Error('未找到PDF页面');
  return canvas.toDataURL('image/jpeg').replace(/^data:image\/jpeg;base64,/, '');
}
</script>

<style scoped>
.translation-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.translation-panel :deep(.el-card__body) {
    height: 100%;
}
.translation-panel :deep(.el-card__body) > div {
    height: 100%;
}
.toolbar {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.result-area {
  flex-grow: 1;
  display: flex;
  background: #f8f8f8;
  border-radius: 8px;
  padding: 16px;
  white-space: pre-wrap;
  overflow-y: auto; 
  height: 80%; 
}
.error {
  color: #f56c6c;
}
.tip {
  color: #aaa;
}
.empty {
  text-align: center;
  color: #aaa;
  padding: 80px 0;
}
</style> 