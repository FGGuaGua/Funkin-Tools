<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { selectFile, selectFolder } from '../services/api'; // 从 api 导入统一函数

const { t } = useI18n();

const props = withDefaults(defineProps<{
  modelValue: string;        // 当前路径（双向绑定）
  placeholder?: string;      // 输入框占位文本
  title?: string;           // 标题
  accept?: string;           // 扩展名限制，如 '.png,.jpg'
  mode?: 'file' | 'folder';  // 初始选择模式：文件 / 文件夹（默认文件）
  modeSwitchable?: boolean;  // 是否显示文件/文件夹切换按钮（false 时隐藏，模式固定）
}>(), {
  mode: 'file',
  modeSwitchable: true,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

// 当前选择模式（组件内部状态，可从 prop 指定初始值）
const mode = ref<'file' | 'folder'>(props.mode ?? 'file');

// 根据路径长度估算输入框宽度：字符越多框越宽，限制在 120px~480px 之间
const inputWidth = computed(() => {
  const width = props.modelValue.length * 8 + 24;
  return `${Math.min(Math.max(width, 120), 480)}px`;
});

// 用于 Web 环境触发隐藏 file input 的 ref
const fileInputRef = ref<HTMLInputElement | null>(null);

// 点击浏览按钮
async function handleBrowse() {
  const result =
    mode.value === 'folder'
      ? await selectFolder(fileInputRef)
      : await selectFile(fileInputRef, props.accept);
  if (result !== null) {
    emit('update:modelValue', result);
  }
}

// 切换选择模式
function setMode(next: 'file' | 'folder') {
  mode.value = next;
}
</script>

<template>
    <div style="padding: 1vh 20px 10px;">
        <div class="file-path-selector">
            <span id="title" style="text-align: left;width: 100%;translate: 8px;" >{{ title || t('filePath.title') }}</span>

            <div class="row2">
                
                <!-- 显示路径的文本框（只读） -->
                <input
                    type="text"
                    :value="modelValue"
                    :style="{ width: inputWidth }"
                    :placeholder="placeholder || (mode === 'folder' ? t('filePath.chooseFolder') : t('filePath.chooseFile'))"
                    readonly
                />
                <!-- 浏览按钮 -->
                <button type="button" @click="handleBrowse">{{ t('filePath.browse') }}</button>
                <!-- 隐藏的 file input（仅 Web 使用） -->
                <input
                    ref="fileInputRef"
                    type="file"
                    style="display: none;"
                    :accept="accept || '*/*'"
                />
                <!-- 模式切换：文件 / 文件夹（modeSwitchable=false 时隐藏） -->
                <div v-if="modeSwitchable" class="mode-toggle">
                    <button
                        type="button"
                        :class="{ active: mode === 'file' }"
                        @click="setMode('file')"
                    >{{ t('filePath.modeFile') }}</button>
                    <button
                        type="button"
                        :class="{ active: mode === 'folder' }"
                        @click="setMode('folder')"
                    >{{ t('filePath.modeFolder') }}</button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.file-path-selector {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-wrap: wrap;
  width: 100%;
}
.row2 {
  display: flex;
  flex: 1;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  max-width: 100%;
}
.mode-toggle {
  display: flex;
  gap: 2px;
  border: 1px solid #1e753e;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}
.mode-toggle button {
  border: none;
  background: transparent;
  padding: 4px 4px;
  font-size: 12px;
  cursor: pointer;
}
.mode-toggle button.active {
  background: #77d99b;
  border-radius: 6px;
  color: #000000;
}
.row2 input[type="text"] {
  min-width: 0;
  flex-shrink: 1;
  max-width: 100%;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
</style>