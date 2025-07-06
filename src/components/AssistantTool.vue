<template>
  <el-card class="assistant-tool" shadow="never">
    <div class="header">
      <span>古文解释工具</span>
    </div>
    
    <div class="assistant-tool-body">
        
      <el-input
        v-model="userPrompt"
        type="textarea"
        :rows="3"
        placeholder="输入古文内容..."
        class="input-box"
      />
      <div class="btns">
        <el-button type="primary" :loading="loading" @click="onExplain">解释</el-button>
        <el-button @click="onClear">清空</el-button>
      </div>
      <div class="result-area">
        <div v-if="loading">解释中...</div>
        <div v-else-if="result">{{ result }}</div>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { ref } from 'vue';
import { useAppStore } from '../stores/appStore';
import { explainClassicalText } from '../utils/api';
import { ElMessage } from 'element-plus';

const store = useAppStore();
const userPrompt = ref('');
const result = ref('');
const loading = ref(false);

function onClear() {
  userPrompt.value = '';
  result.value = '';
}

async function onExplain() {
  if (!userPrompt.value.trim()) {
    ElMessage.warning('请输入古文内容');
    return;
  }
  result.value = '';
  loading.value = true;
  try {
    await explainClassicalText({
      baseURL: store.baseURL,
      apiKey: store.apiKey,
      modelName: store.modelName,
      systemPrompt: store.explainPrompt, // 直接用全局配置
      userPrompt: userPrompt.value,
      onMessage: (msg) => {
        result.value += msg;
      }
    });
  } catch (e) {
    ElMessage.error(e.message || '解释失败');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.assistant-tool {
  height: 100%;
  border-radius: 4px;
  padding: 0;
}
.assistant-tool :deep(.el-card__body) {
    height: 100%;
}
.assistant-tool-body {
  padding: 8px 0 0 0;
  height: 90%;
}
.input-box {
  margin-bottom: 8px;
}
.btns {
  margin-bottom: 8px;
  display: flex;
  gap: 8px;
}
.result-area {
  flex: 1;
  min-height: 0;
  background: #f8f8f8;
  border-radius: 4px;
  padding: 8px;
  white-space: pre-wrap;
  overflow-y: auto;
  height: 60%;
}
</style> 