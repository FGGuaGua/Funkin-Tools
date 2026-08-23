// src/services/api.ts
import { invoke, isTauri } from '@tauri-apps/api/core';
import type { Ref } from 'vue'; // 用于类型提示
import type { z } from 'zod'; // 用于按 schema 解析的泛型参数
import i18n from '../i18n'; // 多语言

const { t } = i18n.global;

/** 弹窗提示的样式类型（原生 dialog 插件仅支持这三种） */
export type DialogKind = 'info' | 'warning' | 'error';

/**
 * 显示一个"提示弹窗"（只有一个确定按钮）。
 * @param text - 提示内容
 * @param kind - 样式：info / warning / error / question
 * @param title - 弹窗标题（web 端浏览器弹窗不支持自定义标题，仅原生端生效）
 * @note web 用浏览器 alert，win/android 用系统原生弹窗
 */
export async function showMessage(
  text: string,
  kind: DialogKind = 'info',
  title = ''
): Promise<void> {
  if (isTauri()) {
    const { message } = await import('@tauri-apps/plugin-dialog');
    await message(text, { title: title || undefined, kind });
  } else {
    window.alert(text); // 浏览器原生 alert，不支持 kind/title
  }
}

/**
 * 显示一个"确认弹窗"（确定 / 取消），返回用户是否点了确定。
 * @param text - 提示内容
 * @param okLabel - 确定按钮文字
 * @param cancelLabel - 取消按钮文字
 * @param title - 弹窗标题（仅原生端生效）
 */
export async function showConfirm(
  text: string,
  okLabel = t('dialog.ok'),
  cancelLabel = t('dialog.cancel'),
  title = ''
): Promise<boolean> {
  if (isTauri()) {
    const { confirm } = await import('@tauri-apps/plugin-dialog');
    return confirm(text, { title: title || undefined, okLabel, cancelLabel });
  } else {
    return window.confirm(text); // 浏览器原生 confirm
  }
}

/**
 * 显示一个"询问弹窗"（是 / 否），返回用户是否点了"是"。
 */
export async function showAsk(
  text: string,
  okLabel = t('dialog.yes'),
  cancelLabel = t('dialog.no'),
  title = ''
): Promise<boolean> {
  if (isTauri()) {
    const { ask } = await import('@tauri-apps/plugin-dialog');
    return ask(text, { title: title || undefined, okLabel, cancelLabel });
  } else {
    // 浏览器无独立"是/否"，用 confirm 充当
    return window.confirm(text);
  }
}

/** Web 端：创建一个隐藏的 <input type="file"> 并返回它（会自动挂到 body） */
function createWebFileInput(accept: string): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = accept;
  input.style.display = 'none';
  document.body.appendChild(input);
  return input;
}

/** Web 端：监听 input change 并把文件读成文本 */
function readWebFileAsText(input: HTMLInputElement): Promise<string> {
  return new Promise((resolve, reject) => {
    input.addEventListener('change', () => {
      try {
        const file = input.files?.[0];
        if (!file) {
          resolve(''); // 用户取消
        } else {
          file.text().then(resolve, reject);
        }
      } catch (e) {
        reject(e);
      } finally {
        input.remove(); // 用完清理
      }
    });
    input.click();
  });
}

type GreetResponse = string;

/** 把 '.png,.jpg' 转成 Tauri dialog 的 filters 配置，未传则不限 */
function buildFilters(accept?: string): Array<{ name: string; extensions: string[] }> {
  if (!accept) {
    return [{ name: t('dialog.allFiles'), extensions: ['*'] }];
  }
  const extensions = accept
    .split(',')
    .map((ext) => ext.trim().replace(/^\./, ''))
    .filter(Boolean);
  if (extensions.length === 0) {
    return [{ name: t('dialog.allFiles'), extensions: ['*'] }];
  }
  return [{ name: t('dialog.selectFile'), extensions }];
}

// 原有的 greet 函数保持不变
export async function greet(name: string): Promise<GreetResponse> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<string>('greet', { name });
  } else {
    return `Hello, ${name}! (This is a mock response from the Web)`;
  }
}

/**
 * 设置标题：Web 端改标签页名称，Tauri(win) 端改窗口标题
 * @param title - 新标题
 */
export async function setTitle(title: string): Promise<void> {
  if (isTauri()) {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().setTitle(title);
  } else {
    document.title = title;
  }
}

/**
 * 统一文件选择函数
 * @param fileInputRef - 可选，Web 环境下用于触发隐藏 input 的 ref
 * @param accept - 可选，扩展名限制，如 '.png,.jpg'，不传则不限
 * @returns 选择的文件路径（Tauri 下为绝对路径，Web 下为文件名），取消或失败返回 null
 */
export async function selectFile(
  fileInputRef?: Ref<HTMLInputElement | null>,
  accept?: string
): Promise<string | null> {
  if (isTauri()) {
    // ---------- Tauri 分支 ----------
    const { open } = await import('@tauri-apps/plugin-dialog');
    try {
      const selected = await open({
        multiple: false,
        filters: buildFilters(accept),
      });
      if (selected && typeof selected === 'string') {
        return selected; // 完整绝对路径
      }
      return null;
    } catch (error) {
      console.error('Tauri 打开文件对话框失败:', error);
      return null;
    }
  } else {
    // ---------- Web 分支 ----------
    // 使用传入的 ref 来触发点击，如果没有则动态创建（但组件里已传入）
    return new Promise((resolve) => {
      let input: HTMLInputElement | null = null;
      if (fileInputRef && fileInputRef.value) {
        input = fileInputRef.value;
      } else {
        // 如果没有传 ref，动态创建（备用）
        input = document.createElement('input');
        input.type = 'file';
        input.style.display = 'none';
        document.body.appendChild(input);
      }

      // 应用扩展名限制
      input!.accept = accept || '*/*';

      input!.addEventListener('change', function onChange() {
        const files = input!.files;
        if (files && files.length > 0) {
          // 浏览器安全：仅返回文件名
          resolve(files[0].name);
        } else {
          resolve(null);
        }
        // 清理事件，避免内存泄漏
        input!.removeEventListener('change', onChange);
        // 如果是动态创建的，移除 DOM
        if (!fileInputRef || !fileInputRef.value) {
          document.body.removeChild(input!);
        }
        // 清空 input 以便重复选择同一文件时再次触发 change
        input!.value = '';
      });

      // 触发点击（如果是隐藏的 input，用户不会看到）
      input!.click();

      // 若用户取消，change 不会触发，我们需要处理？
      // 可以监听窗口焦点恢复，但比较复杂，这里暂不处理，由调用方做超时等
      // 但为了不让 Promise 永远 pending，我们可以设置一个超时（例如 5 分钟）但一般不必要
    });
  }
}

/**
 * 统一文件夹选择函数
 * @param fileInputRef - 可选，Web 环境下用于触发隐藏 input 的 ref
 * @returns 选择的文件夹路径（Tauri 下为绝对路径，Web 下为文件夹名），取消或失败返回 null
 */
export async function selectFolder(
  fileInputRef?: Ref<HTMLInputElement | null>
): Promise<string | null> {
  if (isTauri()) {
    // ---------- Tauri 分支 ----------
    const { open } = await import('@tauri-apps/plugin-dialog');
    try {
      const selected = await open({ directory: true, multiple: false });
      if (selected && typeof selected === 'string') {
        return selected; // 完整绝对路径
      }
      return null;
    } catch (error) {
      console.error('Tauri 打开文件夹对话框失败:', error);
      return null;
    }
  } else {
    // ---------- Web 分支（用 webkitdirectory 让浏览器选择整个文件夹）----------
    return new Promise((resolve) => {
      let input: HTMLInputElement | null = null;
      if (fileInputRef && fileInputRef.value) {
        input = fileInputRef.value;
      } else {
        // 如果没有传 ref，动态创建（备用）
        input = document.createElement('input');
        input.type = 'file';
        input.style.display = 'none';
        document.body.appendChild(input);
      }

      input!.setAttribute('webkitdirectory', '');
      input!.setAttribute('directory', '');

      input!.addEventListener('change', function onChange() {
        const files = input!.files;
        if (files && files.length > 0) {
          // 浏览器安全：仅返回文件夹名（取第一项的相对路径首段）
          const name = files[0].webkitRelativePath.split('/')[0];
          resolve(name);
        } else {
          resolve(null);
        }
        // 清理事件，避免内存泄漏
        input!.removeEventListener('change', onChange);
        // 如果是动态创建的，移除 DOM
        if (!fileInputRef || !fileInputRef.value) {
          document.body.removeChild(input!);
        }
        // 清空 input 以便重复选择同一文件夹时再次触发 change
        input!.removeAttribute('webkitdirectory');
        input!.removeAttribute('directory');
        input!.value = '';
      });

      input!.click();
    });
  }
}

/**
 * 读取一个 JSON 文件，返回未解析的对象（不做 schema 校验）。
 * @param accept - 扩展名过滤，默认 .json
 * @returns 解析后的对象；用户取消返回 null，JSON 格式错误会抛错
 */
async function readRawJson(accept: string): Promise<unknown | null> {
  if (isTauri()) {
    // ---------- Tauri 分支（win / android）----------
    const { open } = await import('@tauri-apps/plugin-dialog');
    const { readTextFile } = await import('@tauri-apps/plugin-fs');
    const selected = await open({
      multiple: false,
      filters: buildFilters(accept),
    });
    if (typeof selected !== 'string') return null; // 用户取消
    const text = await readTextFile(selected);
    return JSON.parse(text);
  } else {
    // ---------- Web 分支（浏览器把文件上传进来读内容）----------
    const input = createWebFileInput(accept);
    const text = await readWebFileAsText(input);
    if (text === '') return null; // 用户取消
    return JSON.parse(text);
  }
}

/**
 * 读取并解析一个 JSON 文件（不做 schema 校验，返回 unknown）。
 * @param accept - 扩展名过滤，默认 .json
 * @returns 解析后的对象；用户取消返回 null，JSON 格式错误会抛错
 */
export async function readJsonFile(accept = '.json'): Promise<unknown | null> {
  return readRawJson(accept);
}

/**
 * 读取 JSON 文件，并按传入的 zod schema 解析为对应类型（json 处理完全由代码完成）。
 * 例如：readJsonAs(RootData) 会返回一个经过校验、含默认值的 Root 对象。
 * @param schema - zod schema，如 ChartData.ts 导出的 RootData
 * @param accept - 扩展名过滤，默认 .json
 * @returns 校验通过的类型化对象；用户取消返回 null，格式/结构不符合会抛错
 */
export async function readJsonAs<T>(
  schema: z.ZodType<T>,
  accept = '.json'
): Promise<T | null> {
  const raw = await readRawJson(accept);
  if (raw === null) return null; // 用户取消
  return schema.parse(raw); // 运行时校验 + 补默认值
}

/**
 * 按指定路径读取并按 zod schema 解析 JSON。
 * 适用于已经通过 FilePathSelector / selectFile 拿到路径的情况（Tauri 端为绝对路径）。
 * @param filePath - 文件路径（Tauri 端）
 * @param schema - zod schema，如 ChartData.ts 导出的 RootData
 * @returns 校验通过的类型化对象；解析失败会抛错
 * @note Web 端浏览器无法按路径访问文件（安全限制），会自动回退为重新选择文件。
 */
export async function readJsonAt<T>(
  filePath: string,
  schema: z.ZodType<T>
): Promise<T | null> {
  if (isTauri()) {
    // ---------- Tauri 分支：直接读该路径 ----------
    const { readTextFile } = await import('@tauri-apps/plugin-fs');
    const text = await readTextFile(filePath);
    return schema.parse(JSON.parse(text)); // 运行时校验 + 补默认值
  } else {
    // ---------- Web 分支：无法按路径读，回退为文件选择 ----------
    return readJsonAs(schema, '.json');
  }
}

/**
 * 把对象保存为一个 JSON 文件（三端可用）。
 * @param data - 要保存的对象
 * @param defaultFileName - 默认文件名（Tauri 保存框 / Web 下载文件名）
 * @returns 保存的文件路径（Web 端无关，返回空字符串）；用户取消返回 null
 */
export async function saveJson(
  data: unknown,
  defaultFileName = 'data.json'
): Promise<string | null> {
  const content = JSON.stringify(data, null, 2);
  if (isTauri()) {
    // ---------- Tauri 分支（弹系统保存框 + 写入文件）----------
    const { save } = await import('@tauri-apps/plugin-dialog');
    const { writeTextFile } = await import('@tauri-apps/plugin-fs');
    const filePath = await save({
      defaultPath: defaultFileName,
      filters: buildFilters('.json'),
    });
    if (typeof filePath !== 'string') return null; // 用户取消
    await writeTextFile(filePath, content);
    return filePath;
  } else {
    // ---------- Web 分支（Blob 触发浏览器下载）----------
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultFileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return '';
  }
}

export async function listFiles(customPath: string):Promise<string[]>
{
  try {
    const files = await invoke<string[]>('read_custom_directory', { path: customPath });
    return files
  } catch (error) {
    console.error('读取失败:', error);
  }
  return []
  
};