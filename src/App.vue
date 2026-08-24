<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { setTitle, showMessage, saveFileDirect } from "./services/api";
import FunkinToolsLogo from "./components/FunkinToolsLogo.vue";
import FilePathSelector from "./components/FilePathSelector.vue";
import { fromCNE, toPsych } from "./data/transfer/ChartData.ts";
import JSZip from "jszip";
import { Root as PsychRoot } from './data/psych/chart/ChartData';
const { t, locale } = useI18n();
watch(locale, (val) => localStorage.setItem('locale', val));

const greetMsg = ref("");
const chartFolderPath = ref("");
const metaFilePath = ref("");

setTitle(t("app.title"));


async function handleProcessing() {
  try {
    const root = await fromCNE(chartFolderPath.value, metaFilePath.value);
    const result = await toPsych(root);
    const zip = new JSZip();
    const diff = (result.diff as string[])
    const chart = (result.chart as PsychRoot[])
    for (let i = 0; i <= diff.length-1; i++)
    {
      zip.file(result.song+"-"+diff[i]+".json", JSON.stringify(chart[i], null, 2));
    }
    const content = await zip.generateAsync({ type: "uint8array" });
    await saveFileDirect(content, `${chartFolderPath.value}/test.zip`);
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