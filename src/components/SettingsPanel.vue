<template>
  <el-card class="settings-panel">
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <el-form :model="form" :rules="rules" ref="formRef"  inline @submit.prevent>
        <el-form-item label="Base URL" prop="baseURL">
          <el-input v-model="form.baseURL" placeholder="如：http://127.0.0.1:9997" style="width:160px" @change="autoSave" />
        </el-form-item>
        <el-form-item label="API_KEY" prop="apiKey">
          <el-input v-model="form.apiKey" placeholder="可为空" style="width:100px" @change="autoSave" />
        </el-form-item>
        <el-form-item label="模型名称" prop="modelName">
          <el-input v-model="form.modelName" placeholder="如：qwen2.5-vl-instruct" style="width:140px" @change="autoSave" />
        </el-form-item>
      </el-form>
      <el-button type="primary" @click="showMore = true">更多设置</el-button>
    </div>
    <el-dialog v-model="showMore" title="更多设置" width="800px">
      <el-form :model="moreForm" label-width="120px">
        <el-form-item label="Base URL">
          <el-input v-model="moreForm.baseURL" placeholder="如：http://127.0.0.1:9997" />
        </el-form-item>
        <el-form-item label="API_KEY">
          <el-input v-model="moreForm.apiKey" placeholder="可为空" />
        </el-form-item>
        <el-form-item label="模型名称">
          <el-input v-model="moreForm.modelName" placeholder="如：qwen2.5-vl-instruct" />
        </el-form-item>
        <el-form-item label="PDF翻译提示词">
          <el-input v-model="moreForm.fetchTranslationPrompt" type="textarea" :rows="6" placeholder="PDF翻译接口的系统提示词" />
        </el-form-item>
        <el-form-item label="古文解释提示词">
          <el-input v-model="moreForm.explainPrompt" type="textarea" :rows="3" placeholder="古文解释接口的系统提示词" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showMore = false">取消</el-button>
        <el-button type="primary" @click="onSaveMore">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, watch,onMounted } from 'vue';
import { useAppStore } from '../stores/appStore';

const store = useAppStore();
const formRef = ref();
const form = ref({
  baseURL: store.baseURL,
  apiKey: store.apiKey,
  modelName: store.modelName,
  fetchTranslationPrompt: store.fetchTranslationPrompt,
  explainPrompt: store.explainPrompt,
});

const showMore = ref(false);
const moreForm = form;

const rules = {
  baseURL: [
    { required: true, message: '请输入 Base URL', trigger: 'blur' },
    { type: 'url', message: '请输入合法的 URL', trigger: 'blur' },
  ],
  apiKey: [],
  modelName: [
    { required: true, message: '请输入模型名称', trigger: 'blur' },
  ],
};

const emit = defineEmits(['config-saved']);

function autoSave() {
  formRef.value.validate((valid) => {
    if (valid) {
      store.setConfig({
        baseURL: form.value.baseURL,
        apiKey: form.value.apiKey,
        modelName: form.value.modelName,
        fetchTranslationPrompt: form.value.fetchTranslationPrompt,
        explainPrompt: form.value.explainPrompt,
      });
      emit('config-saved');
    }
  });
}

function onSaveMore() {
  store.setConfig({
    baseURL: moreForm.value.baseURL,
    apiKey: moreForm.value.apiKey,
    modelName: moreForm.value.modelName,
    fetchTranslationPrompt: moreForm.value.fetchTranslationPrompt,
    explainPrompt: moreForm.value.explainPrompt,
  });
  showMore.value = false;
  emit('config-saved');
}

watch(
  () => showMore.value,
  (val) => {
    if (val) {
      // 打开弹窗时同步数据
      form.value.baseURL = store.baseURL;
      form.value.apiKey = store.apiKey;
      form.value.modelName = store.modelName;
      form.value.fetchTranslationPrompt = store.fetchTranslationPrompt;
      form.value.explainPrompt = store.explainPrompt;
    }
  }
);

onMounted(() => {
    autoSave()
});

</script>

<style scoped>
.settings-panel {
  margin: 0 0 0px 0;
  padding: 0px 0px;
}
</style> 