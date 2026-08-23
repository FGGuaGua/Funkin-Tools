<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { setTitle, readJsonAt, saveJson, showMessage } from "./services/api";
import FunkinToolsLogo from "./components/FunkinToolsLogo.vue";
import FilePathSelector from "./components/FilePathSelector.vue"; // 引入新组件
import { fromCNE, type Root } from "./data/transfer/ChartData.ts";

const { t, locale } = useI18n();
watch(locale, (val) => localStorage.setItem('locale', val)); // 记住语言选择

const greetMsg = ref("");
const chartFolderPath = ref("");
const metaFilePath = ref("");

setTitle(t("app.title"));

async function handleProcessing() {
  try {
    const root = await fromCNE(chartFolderPath.value, metaFilePath.value);
    //const result = await outPsych(); //别急我还没写
    await saveJson(root, 'chart.json');
  } catch (e) {
    showMessage(t('messages.notCodename'),'error',t("messages.readFail"));
    console.error(e)
  }
}

</script>

<template>
  <main class="container">
    <div class="lang-bar" >
      <label for="lang-select">{{ t('language.label') }}</label>
      <select id="lang-select" v-model="locale">
        <option value="zh-CN">简体中文</option>
        <option value="en-US">English</option>
      </select>
    </div>
    <FunkinToolsLogo />
    <FilePathSelector v-model="chartFolderPath" :placeholder="t('filePath.chooseFolder')" :mode-switchable="false" mode="folder" :title="t('filePath.chooseCNEChart')"/>
    <FilePathSelector v-model="metaFilePath" :placeholder="t('filePath.chooseFile')" :mode-switchable="false" accept=".json" :title="t('filePath.chooseMeta')"/>
    
    <form @submit.prevent="handleProcessing">
      <button type="submit">{{ t('app.ok') }}</button>
    </form>
    <p>{{ greetMsg }}</p>

  </main>
</template>

<style scoped>
.lang-bar {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}
</style>