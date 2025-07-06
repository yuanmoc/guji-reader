<template>
  <el-card class="pdf-viewer">
    <div class="pdf-content">
      <!-- 左侧工具栏 -->
      <div class="toolbar">
        <!-- 文件上传区域 -->
        <div class="toolbar-section">
          <el-button type="primary" size="small" style="width: 100%;" @click="openLastFile">
            <el-icon><Upload /></el-icon>
        </el-button>
        </div>
        
        <div class="toolbar-section">
          <el-button-group class="page-controls">
            <el-button @click="prevPage" :disabled="currentPage<=1" size="small">
              <el-icon><ArrowUp /></el-icon>
            </el-button>
            <el-button @click="nextPage" :disabled="currentPage>=numPages" size="small">
              <el-icon><ArrowDown /></el-icon>
            </el-button>
          </el-button-group>
          <div class="page-indicator">
            <div>{{ currentPage }}</div>
            <div>-</div>
            <div>{{ numPages }}</div>
        </div>
        </div>
        
        <div class="toolbar-section">
          <div class="scale-controls">
            <el-slider 
              v-model="scale" 
              :min="0.5" 
              :max="2" 
              :step="0.1" 
              :show-tooltip="false"
              vertical
              height="380px"
            />
            <span class="scale-text">{{ Math.round(scale*100) }}%</span>
          </div>
          <el-button @click="resetView" size="small" class="reset-btn" circle>
            <el-icon><Refresh /></el-icon>
          </el-button>
        </div>
        
        <div class="toolbar-section">
          <el-tooltip content="支持双指缩放、单指拖拽、鼠标滚轮缩放、鼠标拖拽移动、双击重置" placement="right">
            <el-icon class="help-icon"><QuestionFilled /></el-icon>
          </el-tooltip>
        </div>
      </div>
      
      <div v-if="!pdfFile" class="empty">
        <div class="empty-content">
          <div class="empty-icon">
            <el-icon size="48"><Document /></el-icon>
          </div>
          <div class="empty-text">请选择PDF文件</div>
          
          <!-- 显示上次文件信息 -->
          <div v-if="store.hasLastFileInfo()" class="last-file-info">
            <div class="last-file-title">上次阅读的文件：</div>
            <div class="last-file-details">
              <div class="file-name">{{ store.getLastFileInfo().name }}</div>
              <div class="file-meta">
                第 {{ store.getLastFileInfo().currentPage }} 页 | 
                {{ formatFileSize(store.getLastFileInfo().size) }} | 
                {{ formatDate(store.getLastFileInfo().timestamp) }}
              </div>
            </div>
            <div class="last-file-actions">
              <el-button type="primary" size="small" style="width: 100%;" @click="openLastFile">
                打开上次文件
              </el-button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 右侧PDF显示区域 -->
      <div v-else
        ref="canvasContainer" 
        class="canvas-container"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
        @wheel="handleWheel"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp"
        @dblclick="resetView"
      >
        <div ref="pdfWrapper" class="pdf-wrapper">
          <canvas ref="pdfCanvas"></canvas>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { ref, watch, computed, onMounted, nextTick } from 'vue';
import { useAppStore } from '../stores/appStore';
import { ElMessage } from 'element-plus';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { QuestionFilled, ArrowUp, ArrowDown, Refresh, Upload, Delete, Document } from '@element-plus/icons-vue';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const store = useAppStore();
const pdfFile = computed(() => store.pdfFile);
const currentPage = computed(() => store.currentPage);
const scale = ref(store.scale);
const numPages = ref(store.pdfPages);
const canvasContainer = ref();
const pdfWrapper = ref();
const pdfCanvas = ref();
let pdfDoc = null;

// 触摸和变换相关状态
const touchState = ref({
  isTouching: false,
  startDistance: 0,
  startCenter: { x: 0, y: 0 },
  currentDistance: 0,
  currentCenter: { x: 0, y: 0 },
  isDragging: false,
  startDragPos: { x: 0, y: 0 },
  isMouseDragging: false,
  mouseStartPos: { x: 0, y: 0 }
});

const transform = ref({
  scale: 1,
  translateX: 0,
  translateY: 0
});

// 计算两点间距离
function getDistance(touch1, touch2) {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

// 计算两点中心
function getCenter(touch1, touch2) {
  return {
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2
  };
}


// 触摸开始事件
function handleTouchStart(event) {
  event.preventDefault();
  
  if (event.touches.length === 2) {
    // 双指缩放
    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    
    touchState.value.isTouching = true;
    touchState.value.startDistance = getDistance(touch1, touch2);
    touchState.value.startCenter = getCenter(touch1, touch2);
    touchState.value.currentDistance = touchState.value.startDistance;
    touchState.value.currentCenter = touchState.value.startCenter;
  } else if (event.touches.length === 1) {
    // 单指拖拽
    const touch = event.touches[0];
    const rect = canvasContainer.value.getBoundingClientRect();
    
    touchState.value.isDragging = true;
    touchState.value.startDragPos = {
      x: touch.clientX - rect.left - transform.value.translateX,
      y: touch.clientY - rect.top - transform.value.translateY
    };
  }
}

// 触摸移动事件
function handleTouchMove(event) {
  event.preventDefault();
  
  if (event.touches.length === 2 && touchState.value.isTouching) {
    // 双指缩放
    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    
    const currentDistance = getDistance(touch1, touch2);
    const currentCenter = getCenter(touch1, touch2);
    
    // 计算缩放比例
    const scaleFactor = currentDistance / touchState.value.startDistance;
    const newScale = Math.max(0.5, Math.min(3, transform.value.scale * scaleFactor));
    
    // 计算平移
    const deltaX = currentCenter.x - touchState.value.startCenter.x;
    const deltaY = currentCenter.y - touchState.value.startCenter.y;
    
    // 应用变换
    transform.value.scale = newScale;
    transform.value.translateX += deltaX;
    transform.value.translateY += deltaY;
    
    // 更新状态
    touchState.value.currentDistance = currentDistance;
    touchState.value.currentCenter = currentCenter;
    touchState.value.startDistance = currentDistance;
    touchState.value.startCenter = currentCenter;
    
    applyTransform();
  } else if (event.touches.length === 1 && touchState.value.isDragging) {
    // 单指拖拽
    const touch = event.touches[0];
    const rect = canvasContainer.value.getBoundingClientRect();
    
    transform.value.translateX = touch.clientX - rect.left - touchState.value.startDragPos.x;
    transform.value.translateY = touch.clientY - rect.top - touchState.value.startDragPos.y;
    
    applyTransform();
  }
}

// 触摸结束事件
function handleTouchEnd(event) {
  event.preventDefault();
  touchState.value.isTouching = false;
  touchState.value.isDragging = false;
}

// 鼠标滚轮事件
function handleWheel(event) {
  event.preventDefault();
  
  const delta = event.deltaY > 0 ? 0.9 : 1.1;
  const newScale = Math.max(0.5, Math.min(3, transform.value.scale * delta));
  
  // 获取鼠标位置
  const rect = canvasContainer.value.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  
  // 计算缩放中心
  const scaleCenterX = mouseX - transform.value.translateX;
  const scaleCenterY = mouseY - transform.value.translateY;
  
  // 应用缩放
  transform.value.scale = newScale;
  transform.value.translateX = mouseX - scaleCenterX * (newScale / transform.value.scale);
  transform.value.translateY = mouseY - scaleCenterY * (newScale / transform.value.scale);
  
  applyTransform();
}

// 鼠标按下事件
function handleMouseDown(event) {
  event.preventDefault();
  const rect = canvasContainer.value.getBoundingClientRect();
  
  touchState.value.isMouseDragging = true;
  touchState.value.mouseStartPos = {
    x: event.clientX - rect.left - transform.value.translateX,
    y: event.clientY - rect.top - transform.value.translateY
  };
  
  canvasContainer.value.style.cursor = 'grabbing';
}

// 鼠标移动事件
function handleMouseMove(event) {
  if (touchState.value.isMouseDragging) {
    event.preventDefault();
    const rect = canvasContainer.value.getBoundingClientRect();
    
    transform.value.translateX = event.clientX - rect.left - touchState.value.mouseStartPos.x;
    transform.value.translateY = event.clientY - rect.top - touchState.value.mouseStartPos.y;
    
    applyTransform();
  }
}

// 鼠标释放事件
function handleMouseUp(event) {
  touchState.value.isMouseDragging = false;
  canvasContainer.value.style.cursor = 'grab';
}

// 应用变换
function applyTransform() {
  if (pdfWrapper.value) {
    const { scale, translateX, translateY } = transform.value;
    
    
    // 计算边界限制
    const containerRect = canvasContainer.value.getBoundingClientRect();
    const wrapperRect = pdfWrapper.value.getBoundingClientRect();
    
    // 计算缩放后的尺寸
    const scaledWidth = wrapperRect.width * scale;
    const scaledHeight = wrapperRect.height * scale;
    
    // 计算边界
    const maxTranslateX = Math.max(0, (scaledWidth - containerRect.width) / 2);
    const minTranslateX = -Math.max(0, (scaledWidth - containerRect.width) / 2);
    const maxTranslateY = Math.max(0, (scaledHeight - containerRect.height) / 2);
    const minTranslateY = -Math.max(0, (scaledHeight - containerRect.height) / 2);
    
    // 限制平移范围
    const limitedTranslateX = Math.max(minTranslateX, Math.min(maxTranslateX, translateX));
    const limitedTranslateY = Math.max(minTranslateY, Math.min(maxTranslateY, translateY));
    
    // 应用限制后的变换
    pdfWrapper.value.style.transform = `translate(${limitedTranslateX}px, ${limitedTranslateY}px) scale(${scale})`;
    
    // 更新状态
    transform.value.translateX = limitedTranslateX;
    transform.value.translateY = limitedTranslateY;
  }
}

// 重置视图
function resetView() {
  transform.value = {
    scale: 1,
    translateX: 0,
    translateY: 0
  };
  applyTransform();
}

async function loadPdf(file) {
  if (!file) {
    pdfDoc = null;
    numPages.value = 0;
    store.setPdfPages(0);
    clearCanvas();
    return;
  }
  const arrayBuffer = await file.arrayBuffer();
  pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  numPages.value = pdfDoc.numPages;
  store.setPdfPages(pdfDoc.numPages);
  
  // 检查是否需要恢复上次的页面状态
  const lastFileInfo = store.getLastFileInfo();

  if (lastFileInfo && file.name === lastFileInfo.name && file.size === lastFileInfo.size) {
    // 恢复上次的页面和缩放状态
    const targetPage = Math.min(lastFileInfo.currentPage || 1, pdfDoc.numPages);
    const targetScale = lastFileInfo.scale || 0.8;
    store.setCurrentPage(targetPage);
    scale.value = targetScale;
    await nextTick();
    renderPage(targetPage, targetScale);
  } else {
    // 新文件，从第一页开始
    store.setCurrentPage(1);
    await nextTick();
    renderPage(1, scale.value);
  }
}

function clearCanvas() {
  if (pdfCanvas.value) {
    const context = pdfCanvas.value.getContext('2d');
    context.clearRect(0, 0, pdfCanvas.value.width, pdfCanvas.value.height);
  }
}

async function renderPage(pageNum, scaleVal) {
    console.log("renderPage", pageNum, scaleVal)
  if (!pdfDoc || !pdfCanvas.value) return;
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale: scaleVal });
  const context = pdfCanvas.value.getContext('2d');
  pdfCanvas.value.height = viewport.height;
  pdfCanvas.value.width = viewport.width;
  await page.render({ canvasContext: context, viewport }).promise;
  
  // 重置变换
  resetView();
}

watch(pdfFile, (file) => {
  loadPdf(file);
});

watch([currentPage, scale], ([page, s]) => {
  if (pdfDoc) renderPage(page, s);
});

watch(scale, (val) => {
  store.setScale(val);
});

function prevPage() {
  if (currentPage.value > 1) store.setCurrentPage(currentPage.value - 1);
}
function nextPage() {
  if (currentPage.value < numPages.value) store.setCurrentPage(currentPage.value + 1);
}

onMounted(() => {
  if (pdfFile.value) loadPdf(pdfFile.value);
});

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 格式化日期
function formatDate(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 打开上次文件
function openLastFile() {
  const lastFileInfo = store.getLastFileInfo() || {};
    // 创建隐藏的文件输入
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    input.style.display = 'none';

    input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            // 检查是否是同一个文件（通过名称和大小）
            if (file.name === lastFileInfo.name && file.size === lastFileInfo.size) {
                // 恢复上次的页面状态
                store.setCurrentPage(lastFileInfo.currentPage)
                store.setPdfFile(file);
                ElMessage.success(`已打开上次阅读的文件: ${lastFileInfo.name}，已恢复到第 ${lastFileInfo.currentPage} 页`);
            } else {
                ElMessage.success('选择新文件，将开始阅读');
                store.setPdfFile(file);
            }
        }
        // 清理
        document.body.removeChild(input);
    };

    document.body.appendChild(input);
    input.click();
}

</script>

<style scoped>
.pdf-viewer {
  margin: 16px 16px 0 16px;
  height: 96%; /* 继承父容器高度 */
  display: flex; /* 使用flex布局 */
  flex-direction: column; /* 垂直排列 */
}
.pdf-viewer :deep(.el-card__body) {
  flex-grow: 1;
  display: flex;
  padding: 0; /* 移除默认内边距 */
}
/* 空状态容器 */
.empty {
  flex-grow: 1; /* 占据所有可用空间 */
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
  color: #aaa;
}
.pdf-content {
  display: flex;
  height: 100%;
  width: 100%;
}
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #fafafa; /* 浅灰色背景 */
  flex-shrink: 0; /* 防止收缩 */
  padding: 10px 2px;
}
.toolbar-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}
.page-controls {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
}
.page-indicator {
  font-size: 12px;
  font-weight: 600;
  color: #409eff;
  text-align: center;
  padding: 4px 8px;
  background: #ecf5ff;
  border-radius: 4px;
}
.scale-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.scale-text {
  font-size: 12px;
  color: #606266;
  font-weight: 500;
}
.reset-btn {
  margin-top: 4px;
}
.help-icon {
  font-size: 18px;
  color: #909399;
  text-align: center;
  cursor: pointer;
  transition: color 0.2s;
}
.help-icon:hover {
  color: #409eff;
}

.canvas-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 0;
  height: 100%;
  background: #f8f8f8;
  overflow: hidden;
  position: relative;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  border-radius: 0 8px 8px 0; /* 只保留右侧圆角 */
}
.canvas-container:active {
  cursor: grabbing;
}
.canvas-container.grabbing {
  cursor: grabbing;
}
.pdf-wrapper {
  position: relative;
  transform-origin: center center;
  transition: none;
  will-change: transform;
}
.pdf-wrapper canvas {
  display: block;
  max-width: none;
  max-height: none;
  pointer-events: none;
}

/* 新增样式 */
.empty-content {
  text-align: center;
  padding: 20px;
}
.empty-icon {
  margin-bottom: 15px;
}
.empty-text {
  font-size: 18px;
  color: #606266;
  margin-bottom: 20px;
}
.last-file-info {
  background-color: #f0f9eb;
  border: 1px solid #e1f3d8;
  border-radius: 4px;
  padding: 10px 15px;
  margin-top: 20px;
  text-align: left;
}
.last-file-title {
  font-size: 14px;
  color: #67c23a;
  margin-bottom: 5px;
  font-weight: bold;
}
.last-file-details {
  font-size: 13px;
  color: #909399;
  margin-bottom: 10px;
}
.file-name {
  font-weight: 500;
  color: #303133;
}
.file-meta {
  margin-top: 3px;
}
.last-file-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 