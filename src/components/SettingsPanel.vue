<template>
  <el-card class="settings-panel">
    <el-form :model="form" :rules="rules" ref="formRef" class="settings-form" inline @submit.prevent>
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
  </el-card>
</template>

<script setup>
import { ref, watch,onMounted } from 'vue';
import { useAppStore } from '../stores/appStore';

const store = useAppStore();
const formRef = ref();
const form = ref({
  baseURL: store.baseURL || 'http://127.0.0.1:9997',
  apiKey: store.apiKey || '',
  modelName: store.modelName || 'qwen2.5-vl-instruct',
});


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
      });
      emit('config-saved');
    }
  });
}

watch(() => [form.value.baseURL, form.value.apiKey, form.value.modelName], autoSave);


onMounted(() => {
    autoSave()
});

</script>

<style scoped>
.settings-panel {
  margin: 0 0 0px 0;
  padding: 0px 0px;
}
.settings-form {

}
</style> 