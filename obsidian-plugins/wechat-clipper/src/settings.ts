import { App, Plugin, PluginSettingTab, Setting } from "obsidian";
import type { WeChatClipperSettings } from "./types";

export type WeChatClipperPluginSettingsHost = Plugin & {
  settings: WeChatClipperSettings;
  saveSettings: () => Promise<void>;
};

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parseIntOr(value: string, fallback: number): number {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

function parseKeywords(value: string): string[] {
  return value
    .split(/\r?\n|,/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function formatKeywords(value: string[]): string {
  return value.join("\n");
}

export class WeChatClipperSettingTab extends PluginSettingTab {
  private readonly plugin: WeChatClipperPluginSettingsHost;

  constructor(app: App, plugin: WeChatClipperPluginSettingsHost) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("笔记保存路径")
      .setDesc("相对于 Vault 根目录的目标文件夹")
      .addText((text) =>
        text
          .setPlaceholder("inbox/wechat")
          .setValue(this.plugin.settings.noteFolder)
          .onChange(async (value) => {
            this.plugin.settings.noteFolder = value.trim();
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("资源保存路径")
      .setDesc("相对于 Vault 根目录的图片等资源文件夹")
      .addText((text) =>
        text
          .setPlaceholder("assets/wechat")
          .setValue(this.plugin.settings.assetFolder)
          .onChange(async (value) => {
            this.plugin.settings.assetFolder = value.trim();
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("自动裁剪尾部")
      .setDesc("导入时尝试移除“阅读原文”等尾部内容")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.trimTailEnabled).onChange(async (value) => {
          this.plugin.settings.trimTailEnabled = value;
          await this.plugin.saveSettings();
          this.display();
        }),
      );

    const keywordsSetting = new Setting(containerEl)
      .setName("尾部裁剪关键词")
      .setDesc("每行一个关键词，或用逗号分隔");

    const keywordsTextArea = document.createElement("textarea");
    keywordsTextArea.value = formatKeywords(this.plugin.settings.trimTailKeywords);
    keywordsTextArea.rows = 6;
    keywordsTextArea.style.width = "100%";
    keywordsTextArea.addEventListener("change", async () => {
      this.plugin.settings.trimTailKeywords = parseKeywords(keywordsTextArea.value);
      await this.plugin.saveSettings();
    });

    if (!this.plugin.settings.trimTailEnabled) {
      keywordsTextArea.disabled = true;
    }

    keywordsSetting.controlEl.appendChild(keywordsTextArea);

    new Setting(containerEl)
      .setName("User-Agent")
      .setDesc("抓取网页时使用的 User-Agent")
      .addTextArea((text) =>
        text.setValue(this.plugin.settings.userAgent).onChange(async (value) => {
          this.plugin.settings.userAgent = value;
          await this.plugin.saveSettings();
        }),
      );

    containerEl.createEl("h3", { text: "AI" });

    new Setting(containerEl)
      .setName("启用 AI")
      .setDesc("启用后在导入流程中使用 AI 生成主题、标签与摘要")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.aiEnabled).onChange(async (value) => {
          this.plugin.settings.aiEnabled = value;
          await this.plugin.saveSettings();
          this.display();
        }),
      );

    new Setting(containerEl)
      .setName("Base URL")
      .setDesc("例如：https://api.openai.com")
      .addText((text) => {
        text.setValue(this.plugin.settings.aiBaseUrl).onChange(async (value) => {
          this.plugin.settings.aiBaseUrl = value.trim();
          await this.plugin.saveSettings();
        });

        if (!this.plugin.settings.aiEnabled) {
          text.inputEl.disabled = true;
        }
      });

    new Setting(containerEl)
      .setName("Model")
      .setDesc("例如：gpt-4o-mini")
      .addText((text) => {
        text.setValue(this.plugin.settings.aiModel).onChange(async (value) => {
          this.plugin.settings.aiModel = value.trim();
          await this.plugin.saveSettings();
        });

        if (!this.plugin.settings.aiEnabled) {
          text.inputEl.disabled = true;
        }
      });

    new Setting(containerEl)
      .setName("API Key")
      .setDesc("仅保存在本地插件设置中")
      .addText((text) => {
        text.inputEl.type = "password";
        text.setValue(this.plugin.settings.aiApiKey).onChange(async (value) => {
          this.plugin.settings.aiApiKey = value.trim();
          await this.plugin.saveSettings();
        });

        if (!this.plugin.settings.aiEnabled) {
          text.inputEl.disabled = true;
        }
      });

    new Setting(containerEl)
      .setName("输出语言")
      .setDesc("auto=自动，zh=中文，en=English")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("auto", "auto")
          .addOption("zh", "zh")
          .addOption("en", "en")
          .setValue(this.plugin.settings.aiLanguage)
          .onChange(async (value) => {
            this.plugin.settings.aiLanguage = value as any;
            await this.plugin.saveSettings();
          });

        if (!this.plugin.settings.aiEnabled) {
          dropdown.selectEl.disabled = true;
        }
      });

    new Setting(containerEl)
      .setName("请求超时 (ms)")
      .setDesc("1000-120000")
      .addText((text) => {
        text.inputEl.type = "number";
        text.inputEl.min = "1000";
        text.inputEl.max = "120000";
        text.inputEl.step = "1";
        text.setValue(String(this.plugin.settings.aiRequestTimeoutMs));

        text.inputEl.addEventListener("change", async () => {
          const next = clampInt(
            parseIntOr(text.inputEl.value, this.plugin.settings.aiRequestTimeoutMs),
            1000,
            120000,
          );
          this.plugin.settings.aiRequestTimeoutMs = next;
          text.inputEl.value = String(next);
          await this.plugin.saveSettings();
        });

        if (!this.plugin.settings.aiEnabled) {
          text.inputEl.disabled = true;
        }
      });

    new Setting(containerEl)
      .setName("最大输入字符数")
      .setDesc("5000-200000")
      .addText((text) => {
        text.inputEl.type = "number";
        text.inputEl.min = "5000";
        text.inputEl.max = "200000";
        text.inputEl.step = "1";
        text.setValue(String(this.plugin.settings.aiMaxInputChars));

        text.inputEl.addEventListener("change", async () => {
          const next = clampInt(
            parseIntOr(text.inputEl.value, this.plugin.settings.aiMaxInputChars),
            5000,
            200000,
          );
          this.plugin.settings.aiMaxInputChars = next;
          text.inputEl.value = String(next);
          await this.plugin.saveSettings();
        });

        if (!this.plugin.settings.aiEnabled) {
          text.inputEl.disabled = true;
        }
      });

    new Setting(containerEl)
      .setName("摘要最大字符数")
      .setDesc("50-500")
      .addText((text) => {
        text.inputEl.type = "number";
        text.inputEl.min = "50";
        text.inputEl.max = "500";
        text.inputEl.step = "1";
        text.setValue(String(this.plugin.settings.aiSummaryMaxChars));

        text.inputEl.addEventListener("change", async () => {
          const next = clampInt(
            parseIntOr(text.inputEl.value, this.plugin.settings.aiSummaryMaxChars),
            50,
            500,
          );
          this.plugin.settings.aiSummaryMaxChars = next;
          text.inputEl.value = String(next);
          await this.plugin.saveSettings();
        });

        if (!this.plugin.settings.aiEnabled) {
          text.inputEl.disabled = true;
        }
      });

    new Setting(containerEl)
      .setName("最大标签数量")
      .setDesc("1-20")
      .addText((text) => {
        text.inputEl.type = "number";
        text.inputEl.min = "1";
        text.inputEl.max = "20";
        text.inputEl.step = "1";
        text.setValue(String(this.plugin.settings.aiMaxTags));

        text.inputEl.addEventListener("change", async () => {
          const next = clampInt(parseIntOr(text.inputEl.value, this.plugin.settings.aiMaxTags), 1, 20);
          this.plugin.settings.aiMaxTags = next;
          text.inputEl.value = String(next);
          await this.plugin.saveSettings();
        });

        if (!this.plugin.settings.aiEnabled) {
          text.inputEl.disabled = true;
        }
      });
  }
}
