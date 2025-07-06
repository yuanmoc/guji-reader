<script setup>
import { ref } from 'vue';
import SettingsPanel from './components/SettingsPanel.vue';
import PdfViewer from './components/PdfViewer.vue';
import TranslationPanel from './components/TranslationPanel.vue';
import AssistantTool from './components/AssistantTool.vue';
const activeTab = ref('translate');
</script>

<template>
  <div class="main-layout">
    <SettingsPanel class="top-settings" />
    <div class="main-content">
      <div class="left-panel">
        <PdfViewer />
      </div>
      <div class="right-panel">
        <el-tabs v-model="activeTab" class="full-tabs">
          <el-tab-pane label="模型识别" name="translate">
            <div class="tab-content-scroll"><TranslationPanel /></div>
          </el-tab-pane>
          <el-tab-pane label="助手" name="assistant">
            <div class="tab-content-scroll"><AssistantTool /></div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.top-settings {
  height: 70px;
  margin-bottom: 0;
}
.main-content {
  display: flex;
  height: calc(100vh - 90px); 
  overflow: hidden;
}
.left-panel {
  width: 50%;
}
.right-panel {
  width: 50%;
}
.full-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;  
  margin-left: 20px;
}
.full-tabs > .el-tabs__content {
  height: 100%;
}
.full-tabs > .el-tabs__content > .el-tab-pane {
  height: 100%;
} 

.tab-content-scroll {
  flex: 1;
  height: 100%;
  overflow-y: auto;
  padding: 0px 8px 8px 0px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
</style>
