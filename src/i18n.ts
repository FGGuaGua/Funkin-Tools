// 多语言配置（vue-i18n）
import { createI18n } from 'vue-i18n';
import zhCN from './locales/zh-CN';
import enUS from './locales/en-US';

const savedLocale = localStorage.getItem('locale') || 'zh-CN';

const i18n = createI18n({
  legacy: false, // 使用 Composition API 模式（配合 useI18n()）
  locale: savedLocale,
  fallbackLocale: 'zh-CN', // 缺翻译时回退中文
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
});

export default i18n;
