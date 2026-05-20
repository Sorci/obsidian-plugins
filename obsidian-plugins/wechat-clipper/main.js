"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => WeChatClipperPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian5 = require("obsidian");

// src/settings.ts
var import_obsidian = require("obsidian");
function clampInt(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function parseIntOr(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}
function parseKeywords(value) {
  return value.split(/\r?\n|,/g).map((s) => s.trim()).filter((s) => s.length > 0);
}
function formatKeywords(value) {
  return value.join("\n");
}
var WeChatClipperSettingTab = class extends import_obsidian.PluginSettingTab {
  plugin;
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian.Setting(containerEl).setName("\u7B14\u8BB0\u4FDD\u5B58\u8DEF\u5F84").setDesc("\u76F8\u5BF9\u4E8E Vault \u6839\u76EE\u5F55\u7684\u76EE\u6807\u6587\u4EF6\u5939").addText(
      (text) => text.setPlaceholder("inbox/wechat").setValue(this.plugin.settings.noteFolder).onChange(async (value) => {
        this.plugin.settings.noteFolder = value.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("\u8D44\u6E90\u4FDD\u5B58\u8DEF\u5F84").setDesc("\u76F8\u5BF9\u4E8E Vault \u6839\u76EE\u5F55\u7684\u56FE\u7247\u7B49\u8D44\u6E90\u6587\u4EF6\u5939").addText(
      (text) => text.setPlaceholder("assets/wechat").setValue(this.plugin.settings.assetFolder).onChange(async (value) => {
        this.plugin.settings.assetFolder = value.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("\u81EA\u52A8\u88C1\u526A\u5C3E\u90E8").setDesc("\u5BFC\u5165\u65F6\u5C1D\u8BD5\u79FB\u9664\u201C\u9605\u8BFB\u539F\u6587\u201D\u7B49\u5C3E\u90E8\u5185\u5BB9").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.trimTailEnabled).onChange(async (value) => {
        this.plugin.settings.trimTailEnabled = value;
        await this.plugin.saveSettings();
        this.display();
      })
    );
    const keywordsSetting = new import_obsidian.Setting(containerEl).setName("\u5C3E\u90E8\u88C1\u526A\u5173\u952E\u8BCD").setDesc("\u6BCF\u884C\u4E00\u4E2A\u5173\u952E\u8BCD\uFF0C\u6216\u7528\u9017\u53F7\u5206\u9694");
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
    new import_obsidian.Setting(containerEl).setName("User-Agent").setDesc("\u6293\u53D6\u7F51\u9875\u65F6\u4F7F\u7528\u7684 User-Agent").addTextArea(
      (text) => text.setValue(this.plugin.settings.userAgent).onChange(async (value) => {
        this.plugin.settings.userAgent = value;
        await this.plugin.saveSettings();
      })
    );
    containerEl.createEl("h3", { text: "AI" });
    new import_obsidian.Setting(containerEl).setName("\u542F\u7528 AI").setDesc("\u542F\u7528\u540E\u5728\u5BFC\u5165\u6D41\u7A0B\u4E2D\u4F7F\u7528 AI \u751F\u6210\u4E3B\u9898\u3001\u6807\u7B7E\u4E0E\u6458\u8981").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.aiEnabled).onChange(async (value) => {
        this.plugin.settings.aiEnabled = value;
        await this.plugin.saveSettings();
        this.display();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Base URL").setDesc("\u4F8B\u5982\uFF1Ahttps://api.openai.com").addText((text) => {
      text.setValue(this.plugin.settings.aiBaseUrl).onChange(async (value) => {
        this.plugin.settings.aiBaseUrl = value.trim();
        await this.plugin.saveSettings();
      });
      if (!this.plugin.settings.aiEnabled) {
        text.inputEl.disabled = true;
      }
    });
    new import_obsidian.Setting(containerEl).setName("Model").setDesc("\u4F8B\u5982\uFF1Agpt-4o-mini").addText((text) => {
      text.setValue(this.plugin.settings.aiModel).onChange(async (value) => {
        this.plugin.settings.aiModel = value.trim();
        await this.plugin.saveSettings();
      });
      if (!this.plugin.settings.aiEnabled) {
        text.inputEl.disabled = true;
      }
    });
    new import_obsidian.Setting(containerEl).setName("API Key").setDesc("\u4EC5\u4FDD\u5B58\u5728\u672C\u5730\u63D2\u4EF6\u8BBE\u7F6E\u4E2D").addText((text) => {
      text.inputEl.type = "password";
      text.setValue(this.plugin.settings.aiApiKey).onChange(async (value) => {
        this.plugin.settings.aiApiKey = value.trim();
        await this.plugin.saveSettings();
      });
      if (!this.plugin.settings.aiEnabled) {
        text.inputEl.disabled = true;
      }
    });
    new import_obsidian.Setting(containerEl).setName("\u8F93\u51FA\u8BED\u8A00").setDesc("auto=\u81EA\u52A8\uFF0Czh=\u4E2D\u6587\uFF0Cen=English").addDropdown((dropdown) => {
      dropdown.addOption("auto", "auto").addOption("zh", "zh").addOption("en", "en").setValue(this.plugin.settings.aiLanguage).onChange(async (value) => {
        this.plugin.settings.aiLanguage = value;
        await this.plugin.saveSettings();
      });
      if (!this.plugin.settings.aiEnabled) {
        dropdown.selectEl.disabled = true;
      }
    });
    new import_obsidian.Setting(containerEl).setName("\u8BF7\u6C42\u8D85\u65F6 (ms)").setDesc("1000-120000").addText((text) => {
      text.inputEl.type = "number";
      text.inputEl.min = "1000";
      text.inputEl.max = "120000";
      text.inputEl.step = "1";
      text.setValue(String(this.plugin.settings.aiRequestTimeoutMs));
      text.inputEl.addEventListener("change", async () => {
        const next2 = clampInt(
          parseIntOr(text.inputEl.value, this.plugin.settings.aiRequestTimeoutMs),
          1e3,
          12e4
        );
        this.plugin.settings.aiRequestTimeoutMs = next2;
        text.inputEl.value = String(next2);
        await this.plugin.saveSettings();
      });
      if (!this.plugin.settings.aiEnabled) {
        text.inputEl.disabled = true;
      }
    });
    new import_obsidian.Setting(containerEl).setName("\u6700\u5927\u8F93\u5165\u5B57\u7B26\u6570").setDesc("5000-200000").addText((text) => {
      text.inputEl.type = "number";
      text.inputEl.min = "5000";
      text.inputEl.max = "200000";
      text.inputEl.step = "1";
      text.setValue(String(this.plugin.settings.aiMaxInputChars));
      text.inputEl.addEventListener("change", async () => {
        const next2 = clampInt(
          parseIntOr(text.inputEl.value, this.plugin.settings.aiMaxInputChars),
          5e3,
          2e5
        );
        this.plugin.settings.aiMaxInputChars = next2;
        text.inputEl.value = String(next2);
        await this.plugin.saveSettings();
      });
      if (!this.plugin.settings.aiEnabled) {
        text.inputEl.disabled = true;
      }
    });
    new import_obsidian.Setting(containerEl).setName("\u6458\u8981\u6700\u5927\u5B57\u7B26\u6570").setDesc("50-500").addText((text) => {
      text.inputEl.type = "number";
      text.inputEl.min = "50";
      text.inputEl.max = "500";
      text.inputEl.step = "1";
      text.setValue(String(this.plugin.settings.aiSummaryMaxChars));
      text.inputEl.addEventListener("change", async () => {
        const next2 = clampInt(
          parseIntOr(text.inputEl.value, this.plugin.settings.aiSummaryMaxChars),
          50,
          500
        );
        this.plugin.settings.aiSummaryMaxChars = next2;
        text.inputEl.value = String(next2);
        await this.plugin.saveSettings();
      });
      if (!this.plugin.settings.aiEnabled) {
        text.inputEl.disabled = true;
      }
    });
    new import_obsidian.Setting(containerEl).setName("\u6700\u5927\u6807\u7B7E\u6570\u91CF").setDesc("1-20").addText((text) => {
      text.inputEl.type = "number";
      text.inputEl.min = "1";
      text.inputEl.max = "20";
      text.inputEl.step = "1";
      text.setValue(String(this.plugin.settings.aiMaxTags));
      text.inputEl.addEventListener("change", async () => {
        const next2 = clampInt(parseIntOr(text.inputEl.value, this.plugin.settings.aiMaxTags), 1, 20);
        this.plugin.settings.aiMaxTags = next2;
        text.inputEl.value = String(next2);
        await this.plugin.saveSettings();
      });
      if (!this.plugin.settings.aiEnabled) {
        text.inputEl.disabled = true;
      }
    });
  }
};

// src/types.ts
var DEFAULT_SETTINGS = {
  noteFolder: "inbox/wechat",
  assetFolder: "assets/wechat",
  trimTailEnabled: true,
  trimTailKeywords: [
    "\u8D5E\u8D4F",
    "\u6253\u8D4F",
    "\u63A8\u8350\u9605\u8BFB",
    "\u9605\u8BFB\u539F\u6587",
    "\u70B9\u51FB\u9605\u8BFB\u539F\u6587",
    "\u957F\u6309\u8BC6\u522B\u4E8C\u7EF4\u7801",
    "\u626B\u7801\u5173\u6CE8",
    "\u5173\u6CE8\u516C\u4F17\u53F7",
    "\u66F4\u591A\u7CBE\u5F69\u5185\u5BB9"
  ],
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  aiEnabled: false,
  aiBaseUrl: "",
  aiApiKey: "",
  aiModel: "gpt-4o-mini",
  aiRequestTimeoutMs: 3e4,
  aiMaxInputChars: 6e4,
  aiSummaryMaxChars: 150,
  aiMaxTags: 8,
  aiLanguage: "auto"
};

// src/importer/importWeChatArticle.ts
var import_obsidian4 = require("obsidian");

// src/ai/openaiCompatible.ts
var import_obsidian2 = require("obsidian");
function parseJsonObject(content) {
  const trimmed = content.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}
function normalizeAiAnalysis(raw, opts) {
  const topic = typeof raw.topic === "string" ? raw.topic.trim() : "";
  const tagsRaw = Array.isArray(raw.tags) ? raw.tags : [];
  const tags = [];
  const seen = /* @__PURE__ */ new Set();
  for (const t of tagsRaw) {
    if (typeof t !== "string") continue;
    const normalized = t.trim().replace(/^#+/g, "");
    if (!normalized) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    tags.push(normalized);
    if (tags.length >= opts.maxTags) break;
  }
  const summary = typeof raw.summary === "string" ? raw.summary.trim() : "";
  return {
    topic: topic ? topic : void 0,
    tags: tags.length > 0 ? tags : void 0,
    summary: summary ? summary.slice(0, opts.maxSummaryChars) : void 0
  };
}
function hasAiConfig(settings) {
  return Boolean(
    settings.aiEnabled && settings.aiBaseUrl.trim() && settings.aiApiKey.trim() && settings.aiModel.trim()
  );
}
function buildChatCompletionsUrl(baseUrl) {
  const trimmed = baseUrl.trim().replaceAll(/\/+$/g, "");
  const marker = "/chat/completions";
  const idx = trimmed.indexOf(marker);
  if (idx !== -1) return trimmed.slice(0, idx + marker.length);
  if (trimmed.endsWith("/v1")) return `${trimmed}${marker}`;
  return `${trimmed}/v1${marker}`;
}
function languageHint(lang) {
  if (lang === "zh") return "\u7528\u4E2D\u6587\u8F93\u51FA\u3002";
  if (lang === "en") return "Output in English.";
  return "";
}
function withTimeout(p, ms) {
  if (!Number.isFinite(ms) || ms <= 0) return p;
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("AI request timeout")), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}
async function analyzeArticleWithOpenAICompatible(args) {
  const { settings } = args;
  if (!hasAiConfig(settings)) return {};
  const url = buildChatCompletionsUrl(settings.aiBaseUrl);
  const input = args.markdown.slice(0, settings.aiMaxInputChars);
  const system = [
    "You are an assistant that extracts topic/tags/summary from an article.",
    "Return ONLY valid JSON (no markdown, no code fence).",
    `Schema: {"topic":"string","tags":["string"],"summary":"string"}.`,
    `Constraints: tags length <= ${settings.aiMaxTags}; summary <= ${settings.aiSummaryMaxChars} chars.`,
    languageHint(settings.aiLanguage)
  ].filter(Boolean).join(" ");
  const req = (0, import_obsidian2.requestUrl)({
    url,
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${settings.aiApiKey.trim()}`
    },
    body: JSON.stringify({
      model: settings.aiModel.trim(),
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: `Title: ${args.title}

Content:
${input}` }
      ]
    })
  });
  const res = await withTimeout(req, settings.aiRequestTimeoutMs);
  const content = res?.json?.choices?.[0]?.message?.content;
  if (typeof content !== "string") return {};
  const parsed = parseJsonObject(content);
  if (!parsed) return {};
  return normalizeAiAnalysis(parsed, {
    maxTags: settings.aiMaxTags,
    maxSummaryChars: settings.aiSummaryMaxChars
  });
}

// src/importer/cleanArticle.ts
var DEFAULT_REMOVE_SELECTORS = [
  ".qr_code_pc",
  ".reward_qrcode_area",
  ".reward_qrcode",
  ".rich_media_tool",
  ".share_media_tool",
  ".share_tool",
  ".js_profile_qrcode",
  ".profile_container",
  "mp-miniprogram"
];
function cleanWeChatContent(contentEl, opts) {
  for (const sel of DEFAULT_REMOVE_SELECTORS) {
    for (const el of Array.from(contentEl.querySelectorAll(sel))) {
      el.remove();
    }
  }
  if (!opts.trimTailEnabled) return;
  const keywords = opts.trimTailKeywords.map((s) => s.trim()).filter(Boolean);
  if (!keywords.length) return;
  const blocks = Array.from(contentEl.children);
  for (let i = blocks.length - 1; i >= 0; i--) {
    const text = blocks[i].textContent?.trim() ?? "";
    if (!text) continue;
    if (keywords.some((k) => text.includes(k))) {
      for (let j = blocks.length - 1; j >= i; j--) {
        blocks[j].remove();
      }
      break;
    }
  }
}

// src/importer/parseMeta.ts
function parseWeChatMeta(url, html) {
  const meta = { url };
  const ogTitle = html.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1];
  if (ogTitle) meta.title = decodeHtmlEntities(ogTitle.trim());
  const publishTs = html.match(/\bvar\s+ct\s*=\s*['"](\d{10})['"]/i)?.[1];
  if (publishTs) meta.publishDate = new Date(Number(publishTs) * 1e3).toISOString().slice(0, 10);
  return meta;
}
function decodeHtmlEntities(s) {
  return s.replaceAll(/&amp;/g, "&").replaceAll(/&lt;/g, "<").replaceAll(/&gt;/g, ">").replaceAll(/&quot;/g, '"').replaceAll(/&#39;/g, "'");
}

// src/importer/extractArticle.ts
function extractArticle(url, html) {
  const meta = parseWeChatMeta(url, html);
  const doc = new DOMParser().parseFromString(html, "text/html");
  const contentEl = doc.querySelector("#js_content");
  if (!contentEl) throw new Error("Article body not found: #js_content");
  return { meta, contentEl };
}

// src/importer/fetchHtml.ts
var import_obsidian3 = require("obsidian");
async function fetchHtml(url, userAgent) {
  const res = await (0, import_obsidian3.requestUrl)({
    url,
    method: "GET",
    headers: {
      "User-Agent": userAgent,
      Referer: url
    }
  });
  return res.text;
}

// node_modules/turndown/lib/turndown.browser.es.js
function extend(destination) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];
    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) destination[key] = source[key];
    }
  }
  return destination;
}
function repeat(character, count) {
  return Array(count + 1).join(character);
}
function trimLeadingNewlines(string) {
  return string.replace(/^\n*/, "");
}
function trimTrailingNewlines(string) {
  var indexEnd = string.length;
  while (indexEnd > 0 && string[indexEnd - 1] === "\n") indexEnd--;
  return string.substring(0, indexEnd);
}
function trimNewlines(string) {
  return trimTrailingNewlines(trimLeadingNewlines(string));
}
var blockElements = ["ADDRESS", "ARTICLE", "ASIDE", "AUDIO", "BLOCKQUOTE", "BODY", "CANVAS", "CENTER", "DD", "DIR", "DIV", "DL", "DT", "FIELDSET", "FIGCAPTION", "FIGURE", "FOOTER", "FORM", "FRAMESET", "H1", "H2", "H3", "H4", "H5", "H6", "HEADER", "HGROUP", "HR", "HTML", "ISINDEX", "LI", "MAIN", "MENU", "NAV", "NOFRAMES", "NOSCRIPT", "OL", "OUTPUT", "P", "PRE", "SECTION", "TABLE", "TBODY", "TD", "TFOOT", "TH", "THEAD", "TR", "UL"];
function isBlock(node) {
  return is(node, blockElements);
}
var voidElements = ["AREA", "BASE", "BR", "COL", "COMMAND", "EMBED", "HR", "IMG", "INPUT", "KEYGEN", "LINK", "META", "PARAM", "SOURCE", "TRACK", "WBR"];
function isVoid(node) {
  return is(node, voidElements);
}
function hasVoid(node) {
  return has(node, voidElements);
}
var meaningfulWhenBlankElements = ["A", "TABLE", "THEAD", "TBODY", "TFOOT", "TH", "TD", "IFRAME", "SCRIPT", "AUDIO", "VIDEO"];
function isMeaningfulWhenBlank(node) {
  return is(node, meaningfulWhenBlankElements);
}
function hasMeaningfulWhenBlank(node) {
  return has(node, meaningfulWhenBlankElements);
}
function is(node, tagNames) {
  return tagNames.indexOf(node.nodeName) >= 0;
}
function has(node, tagNames) {
  return node.getElementsByTagName && tagNames.some(function(tagName) {
    return node.getElementsByTagName(tagName).length;
  });
}
var markdownEscapes = [[/\\/g, "\\\\"], [/\*/g, "\\*"], [/^-/g, "\\-"], [/^\+ /g, "\\+ "], [/^(=+)/g, "\\$1"], [/^(#{1,6}) /g, "\\$1 "], [/`/g, "\\`"], [/^~~~/g, "\\~~~"], [/\[/g, "\\["], [/\]/g, "\\]"], [/^>/g, "\\>"], [/_/g, "\\_"], [/^(\d+)\. /g, "$1\\. "]];
function escapeMarkdown(string) {
  return markdownEscapes.reduce(function(accumulator, escape) {
    return accumulator.replace(escape[0], escape[1]);
  }, string);
}
var rules = {};
rules.paragraph = {
  filter: "p",
  replacement: function(content) {
    return "\n\n" + content + "\n\n";
  }
};
rules.lineBreak = {
  filter: "br",
  replacement: function(content, node, options) {
    return options.br + "\n";
  }
};
rules.heading = {
  filter: ["h1", "h2", "h3", "h4", "h5", "h6"],
  replacement: function(content, node, options) {
    var hLevel = Number(node.nodeName.charAt(1));
    if (options.headingStyle === "setext" && hLevel < 3) {
      var underline = repeat(hLevel === 1 ? "=" : "-", content.length);
      return "\n\n" + content + "\n" + underline + "\n\n";
    } else {
      return "\n\n" + repeat("#", hLevel) + " " + content + "\n\n";
    }
  }
};
rules.blockquote = {
  filter: "blockquote",
  replacement: function(content) {
    content = trimNewlines(content).replace(/^/gm, "> ");
    return "\n\n" + content + "\n\n";
  }
};
rules.list = {
  filter: ["ul", "ol"],
  replacement: function(content, node) {
    var parent = node.parentNode;
    if (parent.nodeName === "LI" && parent.lastElementChild === node) {
      return "\n" + content;
    } else {
      return "\n\n" + content + "\n\n";
    }
  }
};
rules.listItem = {
  filter: "li",
  replacement: function(content, node, options) {
    var prefix = options.bulletListMarker + "   ";
    var parent = node.parentNode;
    if (parent.nodeName === "OL") {
      var start = parent.getAttribute("start");
      var index = Array.prototype.indexOf.call(parent.children, node);
      prefix = (start ? Number(start) + index : index + 1) + ".  ";
    }
    var isParagraph = /\n$/.test(content);
    content = trimNewlines(content) + (isParagraph ? "\n" : "");
    content = content.replace(/\n/gm, "\n" + " ".repeat(prefix.length));
    return prefix + content + (node.nextSibling ? "\n" : "");
  }
};
rules.indentedCodeBlock = {
  filter: function(node, options) {
    return options.codeBlockStyle === "indented" && node.nodeName === "PRE" && node.firstChild && node.firstChild.nodeName === "CODE";
  },
  replacement: function(content, node, options) {
    return "\n\n    " + node.firstChild.textContent.replace(/\n/g, "\n    ") + "\n\n";
  }
};
rules.fencedCodeBlock = {
  filter: function(node, options) {
    return options.codeBlockStyle === "fenced" && node.nodeName === "PRE" && node.firstChild && node.firstChild.nodeName === "CODE";
  },
  replacement: function(content, node, options) {
    var className = node.firstChild.getAttribute("class") || "";
    var language = (className.match(/language-(\S+)/) || [null, ""])[1];
    var code = node.firstChild.textContent;
    var fenceChar = options.fence.charAt(0);
    var fenceSize = 3;
    var fenceInCodeRegex = new RegExp("^" + fenceChar + "{3,}", "gm");
    var match;
    while (match = fenceInCodeRegex.exec(code)) {
      if (match[0].length >= fenceSize) {
        fenceSize = match[0].length + 1;
      }
    }
    var fence = repeat(fenceChar, fenceSize);
    return "\n\n" + fence + language + "\n" + code.replace(/\n$/, "") + "\n" + fence + "\n\n";
  }
};
rules.horizontalRule = {
  filter: "hr",
  replacement: function(content, node, options) {
    return "\n\n" + options.hr + "\n\n";
  }
};
rules.inlineLink = {
  filter: function(node, options) {
    return options.linkStyle === "inlined" && node.nodeName === "A" && node.getAttribute("href");
  },
  replacement: function(content, node) {
    var href = escapeLinkDestination(node.getAttribute("href"));
    var title = escapeLinkTitle(cleanAttribute(node.getAttribute("title")));
    var titlePart = title ? ' "' + title + '"' : "";
    return "[" + content + "](" + href + titlePart + ")";
  }
};
rules.referenceLink = {
  filter: function(node, options) {
    return options.linkStyle === "referenced" && node.nodeName === "A" && node.getAttribute("href");
  },
  replacement: function(content, node, options) {
    var href = escapeLinkDestination(node.getAttribute("href"));
    var title = cleanAttribute(node.getAttribute("title"));
    if (title) title = ' "' + escapeLinkTitle(title) + '"';
    var replacement;
    var reference;
    switch (options.linkReferenceStyle) {
      case "collapsed":
        replacement = "[" + content + "][]";
        reference = "[" + content + "]: " + href + title;
        break;
      case "shortcut":
        replacement = "[" + content + "]";
        reference = "[" + content + "]: " + href + title;
        break;
      default:
        var id = this.references.length + 1;
        replacement = "[" + content + "][" + id + "]";
        reference = "[" + id + "]: " + href + title;
    }
    this.references.push(reference);
    return replacement;
  },
  references: [],
  append: function(options) {
    var references = "";
    if (this.references.length) {
      references = "\n\n" + this.references.join("\n") + "\n\n";
      this.references = [];
    }
    return references;
  }
};
rules.emphasis = {
  filter: ["em", "i"],
  replacement: function(content, node, options) {
    if (!content.trim()) return "";
    return options.emDelimiter + content + options.emDelimiter;
  }
};
rules.strong = {
  filter: ["strong", "b"],
  replacement: function(content, node, options) {
    if (!content.trim()) return "";
    return options.strongDelimiter + content + options.strongDelimiter;
  }
};
rules.code = {
  filter: function(node) {
    var hasSiblings = node.previousSibling || node.nextSibling;
    var isCodeBlock = node.parentNode.nodeName === "PRE" && !hasSiblings;
    return node.nodeName === "CODE" && !isCodeBlock;
  },
  replacement: function(content) {
    if (!content) return "";
    content = content.replace(/\r?\n|\r/g, " ");
    var extraSpace = /^`|^ .*?[^ ].* $|`$/.test(content) ? " " : "";
    var delimiter = "`";
    var matches = content.match(/`+/gm) || [];
    while (matches.indexOf(delimiter) !== -1) delimiter = delimiter + "`";
    return delimiter + extraSpace + content + extraSpace + delimiter;
  }
};
rules.image = {
  filter: "img",
  replacement: function(content, node) {
    var alt = escapeMarkdown(cleanAttribute(node.getAttribute("alt")));
    var src = escapeLinkDestination(node.getAttribute("src") || "");
    var title = cleanAttribute(node.getAttribute("title"));
    var titlePart = title ? ' "' + escapeLinkTitle(title) + '"' : "";
    return src ? "![" + alt + "](" + src + titlePart + ")" : "";
  }
};
function cleanAttribute(attribute) {
  return attribute ? attribute.replace(/(\n+\s*)+/g, "\n") : "";
}
function escapeLinkDestination(destination) {
  var escaped = destination.replace(/([<>()])/g, "\\$1");
  return escaped.indexOf(" ") >= 0 ? "<" + escaped + ">" : escaped;
}
function escapeLinkTitle(title) {
  return title.replace(/"/g, '\\"');
}
function Rules(options) {
  this.options = options;
  this._keep = [];
  this._remove = [];
  this.blankRule = {
    replacement: options.blankReplacement
  };
  this.keepReplacement = options.keepReplacement;
  this.defaultRule = {
    replacement: options.defaultReplacement
  };
  this.array = [];
  for (var key in options.rules) this.array.push(options.rules[key]);
}
Rules.prototype = {
  add: function(key, rule) {
    this.array.unshift(rule);
  },
  keep: function(filter) {
    this._keep.unshift({
      filter,
      replacement: this.keepReplacement
    });
  },
  remove: function(filter) {
    this._remove.unshift({
      filter,
      replacement: function() {
        return "";
      }
    });
  },
  forNode: function(node) {
    if (node.isBlank) return this.blankRule;
    var rule;
    if (rule = findRule(this.array, node, this.options)) return rule;
    if (rule = findRule(this._keep, node, this.options)) return rule;
    if (rule = findRule(this._remove, node, this.options)) return rule;
    return this.defaultRule;
  },
  forEach: function(fn) {
    for (var i = 0; i < this.array.length; i++) fn(this.array[i], i);
  }
};
function findRule(rules2, node, options) {
  for (var i = 0; i < rules2.length; i++) {
    var rule = rules2[i];
    if (filterValue(rule, node, options)) return rule;
  }
  return void 0;
}
function filterValue(rule, node, options) {
  var filter = rule.filter;
  if (typeof filter === "string") {
    if (filter === node.nodeName.toLowerCase()) return true;
  } else if (Array.isArray(filter)) {
    if (filter.indexOf(node.nodeName.toLowerCase()) > -1) return true;
  } else if (typeof filter === "function") {
    if (filter.call(rule, node, options)) return true;
  } else {
    throw new TypeError("`filter` needs to be a string, array, or function");
  }
}
function collapseWhitespace(options) {
  var element = options.element;
  var isBlock2 = options.isBlock;
  var isVoid2 = options.isVoid;
  var isPre = options.isPre || function(node2) {
    return node2.nodeName === "PRE";
  };
  if (!element.firstChild || isPre(element)) return;
  var prevText = null;
  var keepLeadingWs = false;
  var prev = null;
  var node = next(prev, element, isPre);
  while (node !== element) {
    if (node.nodeType === 3 || node.nodeType === 4) {
      var text = node.data.replace(/[ \r\n\t]+/g, " ");
      if ((!prevText || / $/.test(prevText.data)) && !keepLeadingWs && text[0] === " ") {
        text = text.substr(1);
      }
      if (!text) {
        node = remove(node);
        continue;
      }
      node.data = text;
      prevText = node;
    } else if (node.nodeType === 1) {
      if (isBlock2(node) || node.nodeName === "BR") {
        if (prevText) {
          prevText.data = prevText.data.replace(/ $/, "");
        }
        prevText = null;
        keepLeadingWs = false;
      } else if (isVoid2(node) || isPre(node)) {
        prevText = null;
        keepLeadingWs = true;
      } else if (prevText) {
        keepLeadingWs = false;
      }
    } else {
      node = remove(node);
      continue;
    }
    var nextNode = next(prev, node, isPre);
    prev = node;
    node = nextNode;
  }
  if (prevText) {
    prevText.data = prevText.data.replace(/ $/, "");
    if (!prevText.data) {
      remove(prevText);
    }
  }
}
function remove(node) {
  var next2 = node.nextSibling || node.parentNode;
  node.parentNode.removeChild(node);
  return next2;
}
function next(prev, current, isPre) {
  if (prev && prev.parentNode === current || isPre(current)) {
    return current.nextSibling || current.parentNode;
  }
  return current.firstChild || current.nextSibling || current.parentNode;
}
var root = typeof window !== "undefined" ? window : {};
function canParseHTMLNatively() {
  var Parser = root.DOMParser;
  var canParse = false;
  try {
    if (new Parser().parseFromString("", "text/html")) {
      canParse = true;
    }
  } catch (e) {
  }
  return canParse;
}
function createHTMLParser() {
  var Parser = function() {
  };
  {
    if (shouldUseActiveX()) {
      Parser.prototype.parseFromString = function(string) {
        var doc = new window.ActiveXObject("htmlfile");
        doc.designMode = "on";
        doc.open();
        doc.write(string);
        doc.close();
        return doc;
      };
    } else {
      Parser.prototype.parseFromString = function(string) {
        var doc = document.implementation.createHTMLDocument("");
        doc.open();
        doc.write(string);
        doc.close();
        return doc;
      };
    }
  }
  return Parser;
}
function shouldUseActiveX() {
  var useActiveX = false;
  try {
    document.implementation.createHTMLDocument("").open();
  } catch (e) {
    if (root.ActiveXObject) useActiveX = true;
  }
  return useActiveX;
}
var HTMLParser = canParseHTMLNatively() ? root.DOMParser : createHTMLParser();
function RootNode(input, options) {
  var root2;
  if (typeof input === "string") {
    var doc = htmlParser().parseFromString(
      // DOM parsers arrange elements in the <head> and <body>.
      // Wrapping in a custom element ensures elements are reliably arranged in
      // a single element.
      '<x-turndown id="turndown-root">' + input + "</x-turndown>",
      "text/html"
    );
    root2 = doc.getElementById("turndown-root");
  } else {
    root2 = input.cloneNode(true);
  }
  collapseWhitespace({
    element: root2,
    isBlock,
    isVoid,
    isPre: options.preformattedCode ? isPreOrCode : null
  });
  return root2;
}
var _htmlParser;
function htmlParser() {
  _htmlParser = _htmlParser || new HTMLParser();
  return _htmlParser;
}
function isPreOrCode(node) {
  return node.nodeName === "PRE" || node.nodeName === "CODE";
}
function Node(node, options) {
  node.isBlock = isBlock(node);
  node.isCode = node.nodeName === "CODE" || node.parentNode.isCode;
  node.isBlank = isBlank(node);
  node.flankingWhitespace = flankingWhitespace(node, options);
  return node;
}
function isBlank(node) {
  return !isVoid(node) && !isMeaningfulWhenBlank(node) && /^\s*$/i.test(node.textContent) && !hasVoid(node) && !hasMeaningfulWhenBlank(node);
}
function flankingWhitespace(node, options) {
  if (node.isBlock || options.preformattedCode && node.isCode) {
    return {
      leading: "",
      trailing: ""
    };
  }
  var edges = edgeWhitespace(node.textContent);
  if (edges.leadingAscii && isFlankedByWhitespace("left", node, options)) {
    edges.leading = edges.leadingNonAscii;
  }
  if (edges.trailingAscii && isFlankedByWhitespace("right", node, options)) {
    edges.trailing = edges.trailingNonAscii;
  }
  return {
    leading: edges.leading,
    trailing: edges.trailing
  };
}
function edgeWhitespace(string) {
  var m = string.match(/^(([ \t\r\n]*)(\s*))(?:(?=\S)[\s\S]*\S)?((\s*?)([ \t\r\n]*))$/);
  return {
    leading: m[1],
    // whole string for whitespace-only strings
    leadingAscii: m[2],
    leadingNonAscii: m[3],
    trailing: m[4],
    // empty for whitespace-only strings
    trailingNonAscii: m[5],
    trailingAscii: m[6]
  };
}
function isFlankedByWhitespace(side, node, options) {
  var sibling;
  var regExp;
  var isFlanked;
  if (side === "left") {
    sibling = node.previousSibling;
    regExp = / $/;
  } else {
    sibling = node.nextSibling;
    regExp = /^ /;
  }
  if (sibling) {
    if (sibling.nodeType === 3) {
      isFlanked = regExp.test(sibling.nodeValue);
    } else if (options.preformattedCode && sibling.nodeName === "CODE") {
      isFlanked = false;
    } else if (sibling.nodeType === 1 && !isBlock(sibling)) {
      isFlanked = regExp.test(sibling.textContent);
    }
  }
  return isFlanked;
}
var reduce = Array.prototype.reduce;
function TurndownService(options) {
  if (!(this instanceof TurndownService)) return new TurndownService(options);
  var defaults = {
    rules,
    headingStyle: "setext",
    hr: "* * *",
    bulletListMarker: "*",
    codeBlockStyle: "indented",
    fence: "```",
    emDelimiter: "_",
    strongDelimiter: "**",
    linkStyle: "inlined",
    linkReferenceStyle: "full",
    br: "  ",
    preformattedCode: false,
    blankReplacement: function(content, node) {
      return node.isBlock ? "\n\n" : "";
    },
    keepReplacement: function(content, node) {
      return node.isBlock ? "\n\n" + node.outerHTML + "\n\n" : node.outerHTML;
    },
    defaultReplacement: function(content, node) {
      return node.isBlock ? "\n\n" + content + "\n\n" : content;
    }
  };
  this.options = extend({}, defaults, options);
  this.rules = new Rules(this.options);
}
TurndownService.prototype = {
  /**
   * The entry point for converting a string or DOM node to Markdown
   * @public
   * @param {String|HTMLElement} input The string or DOM node to convert
   * @returns A Markdown representation of the input
   * @type String
   */
  turndown: function(input) {
    if (!canConvert(input)) {
      throw new TypeError(input + " is not a string, or an element/document/fragment node.");
    }
    if (input === "") return "";
    var output = process.call(this, new RootNode(input, this.options));
    return postProcess.call(this, output);
  },
  /**
   * Add one or more plugins
   * @public
   * @param {Function|Array} plugin The plugin or array of plugins to add
   * @returns The Turndown instance for chaining
   * @type Object
   */
  use: function(plugin) {
    if (Array.isArray(plugin)) {
      for (var i = 0; i < plugin.length; i++) this.use(plugin[i]);
    } else if (typeof plugin === "function") {
      plugin(this);
    } else {
      throw new TypeError("plugin must be a Function or an Array of Functions");
    }
    return this;
  },
  /**
   * Adds a rule
   * @public
   * @param {String} key The unique key of the rule
   * @param {Object} rule The rule
   * @returns The Turndown instance for chaining
   * @type Object
   */
  addRule: function(key, rule) {
    this.rules.add(key, rule);
    return this;
  },
  /**
   * Keep a node (as HTML) that matches the filter
   * @public
   * @param {String|Array|Function} filter The unique key of the rule
   * @returns The Turndown instance for chaining
   * @type Object
   */
  keep: function(filter) {
    this.rules.keep(filter);
    return this;
  },
  /**
   * Remove a node that matches the filter
   * @public
   * @param {String|Array|Function} filter The unique key of the rule
   * @returns The Turndown instance for chaining
   * @type Object
   */
  remove: function(filter) {
    this.rules.remove(filter);
    return this;
  },
  /**
   * Escapes Markdown syntax
   * @public
   * @param {String} string The string to escape
   * @returns A string with Markdown syntax escaped
   * @type String
   */
  escape: function(string) {
    return escapeMarkdown(string);
  }
};
function process(parentNode) {
  var self = this;
  return reduce.call(parentNode.childNodes, function(output, node) {
    node = new Node(node, self.options);
    var replacement = "";
    if (node.nodeType === 3) {
      replacement = node.isCode ? node.nodeValue : self.escape(node.nodeValue);
    } else if (node.nodeType === 1) {
      replacement = replacementForNode.call(self, node);
    }
    return join(output, replacement);
  }, "");
}
function postProcess(output) {
  var self = this;
  this.rules.forEach(function(rule) {
    if (typeof rule.append === "function") {
      output = join(output, rule.append(self.options));
    }
  });
  return output.replace(/^[\t\r\n]+/, "").replace(/[\t\r\n\s]+$/, "");
}
function replacementForNode(node) {
  var rule = this.rules.forNode(node);
  var content = process.call(this, node);
  var whitespace = node.flankingWhitespace;
  if (whitespace.leading || whitespace.trailing) content = content.trim();
  return whitespace.leading + rule.replacement(content, node, this.options) + whitespace.trailing;
}
function join(output, replacement) {
  var s1 = trimTrailingNewlines(output);
  var s2 = trimLeadingNewlines(replacement);
  var nls = Math.max(output.length - s1.length, replacement.length - s2.length);
  var separator = "\n\n".substring(0, nls);
  return s1 + separator + s2;
}
function canConvert(input) {
  return input != null && (typeof input === "string" || input.nodeType && (input.nodeType === 1 || input.nodeType === 9 || input.nodeType === 11));
}

// src/importer/htmlToMarkdown.ts
function escapeMarkdownAltText(input) {
  return input.replaceAll("[", "\\[").replaceAll("]", "\\]");
}
function htmlToMarkdown(contentEl) {
  const service = new TurndownService();
  service.addRule("wechat-image", {
    filter: "img",
    replacement(_content, node) {
      const img = node;
      const src = img.getAttribute("data-src") ?? img.getAttribute("src") ?? "";
      if (!src) return "";
      const alt = escapeMarkdownAltText(img.getAttribute("alt") ?? "");
      return `![${alt}](${src})`;
    }
  });
  return service.turndown(contentEl);
}

// src/importer/pathing.ts
function sanitizeFileStem(input) {
  const s = input.replaceAll(/[\\/:*?"<>|]/g, " ").replaceAll(/\s+/g, " ").trim();
  return s.length ? s : "untitled";
}
function joinPosix(...parts) {
  return parts.join("/").replaceAll(/\/+/g, "/").replaceAll(/^\/|\/$/g, "");
}
function ensureMdExt(stem) {
  return stem.toLowerCase().endsWith(".md") ? stem : `${stem}.md`;
}

// src/importer/localizeImages.ts
var MARKDOWN_IMAGE_RE = /!\[[^\]]*]\(\s*(<[^>]+>|[^)\s]+)(\s+(?:(?:"[^"]*")|(?:'[^']*')))?\s*\)/g;
async function ensureFolder(vault, folderPath) {
  const parts = joinPosix(folderPath).split("/").filter(Boolean);
  let acc = "";
  for (const part of parts) {
    acc = acc ? `${acc}/${part}` : part;
    if (vault.getAbstractFileByPath(acc)) continue;
    try {
      await vault.createFolder(acc);
    } catch {
      if (!vault.getAbstractFileByPath(acc)) throw new Error(`Failed to create folder: ${acc}`);
    }
  }
}
async function localizeImages(params) {
  const { vault, markdown, noteFolder, assetFolder, noteStem, referer, userAgent } = params;
  const request = params.requestUrl;
  const matches = Array.from(markdown.matchAll(MARKDOWN_IMAGE_RE));
  const urls = [];
  for (const m of matches) {
    const raw = m[1] ?? "";
    const url = unwrapAngle(raw).trim();
    if (!isHttpUrl(url)) continue;
    if (!urls.includes(url)) urls.push(url);
  }
  const assetDir = joinPosix(assetFolder, noteStem);
  await ensureFolder(vault, assetDir);
  const usedNames = /* @__PURE__ */ new Set();
  const rewrites = /* @__PURE__ */ new Map();
  let imageFailed = 0;
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    try {
      const res = await request({
        url,
        method: "GET",
        headers: {
          Referer: referer,
          "User-Agent": userAgent
        }
      });
      const contentType = getHeader(res.headers, "content-type");
      const fileName = makeUniqueFileName(resolveFileName(url, contentType, i + 1), usedNames);
      const targetPath = joinPosix(assetDir, fileName);
      await writeBinary(vault, targetPath, res.arrayBuffer);
      const rel = relativePosix(joinPosix(noteFolder), targetPath);
      rewrites.set(url, rel);
    } catch {
      imageFailed += 1;
    }
  }
  const out = markdown.replaceAll(MARKDOWN_IMAGE_RE, (full, rawUrl) => {
    const url = unwrapAngle(String(rawUrl)).trim();
    const rel = rewrites.get(url);
    if (!rel) return full;
    const wrapped = isAngleWrapped(String(rawUrl)) ? `<${rel}>` : rel;
    return full.replace(String(rawUrl), wrapped);
  });
  return { markdown: out, imageTotal: urls.length, imageFailed };
}
function isHttpUrl(url) {
  return /^https?:\/\//i.test(url);
}
function isAngleWrapped(token) {
  return token.startsWith("<") && token.endsWith(">");
}
function unwrapAngle(token) {
  return isAngleWrapped(token) ? token.slice(1, -1) : token;
}
function getHeader(headers, name) {
  const needle = name.toLowerCase();
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === needle) return v;
  }
  return void 0;
}
function resolveFileName(url, contentType, index) {
  const parsed = safeUrl(url);
  const pathname = parsed?.pathname ?? "";
  const last = pathname.split("/").filter(Boolean).pop() ?? "";
  const base = sanitizeFileName(safeDecodeURIComponent(last)) || `image-${index}`;
  const dot = base.lastIndexOf(".");
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const ext = dot > 0 ? base.slice(dot + 1) : "";
  const finalExt = ext || extFromContentType(contentType) || "bin";
  return `${stem}.${finalExt}`;
}
function extFromContentType(contentType) {
  const v = (contentType ?? "").split(";")[0].trim().toLowerCase();
  if (v === "image/png") return "png";
  if (v === "image/jpeg") return "jpg";
  if (v === "image/jpg") return "jpg";
  if (v === "image/gif") return "gif";
  if (v === "image/webp") return "webp";
  if (v === "image/svg+xml") return "svg";
  return void 0;
}
function makeUniqueFileName(name, used) {
  const dot = name.lastIndexOf(".");
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  let out = `${stem}${ext}`;
  let n = 2;
  while (used.has(out)) {
    out = `${stem}-${n}${ext}`;
    n += 1;
  }
  used.add(out);
  return out;
}
function sanitizeFileName(input) {
  const s = input.replaceAll(/[\\/:*?"<>|]/g, "-").replaceAll(/\s+/g, "-").replaceAll(/-+/g, "-").replaceAll(/^\.+/g, "").replaceAll(/\.+$/g, "").trim();
  return s;
}
function safeDecodeURIComponent(input) {
  try {
    return decodeURIComponent(input);
  } catch {
    return input;
  }
}
function safeUrl(input) {
  try {
    return new URL(input);
  } catch {
    return void 0;
  }
}
async function writeBinary(vault, path, data) {
  try {
    await vault.createBinary(path, data);
  } catch {
    const adapter = vault.adapter;
    const writeBinaryFn = adapter?.writeBinary;
    if (writeBinaryFn) {
      await writeBinaryFn.call(adapter, path, data);
      return;
    }
    throw new Error(`Failed to write binary: ${path}`);
  }
}
function relativePosix(fromDir, toPath) {
  const from = joinPosix(fromDir).split("/").filter(Boolean);
  const to = joinPosix(toPath).split("/").filter(Boolean);
  let i = 0;
  while (i < from.length && i < to.length && from[i] === to[i]) i += 1;
  const up = from.length - i;
  const parts = [];
  for (let j = 0; j < up; j++) parts.push("..");
  parts.push(...to.slice(i));
  return parts.length ? parts.join("/") : ".";
}

// src/importer/aiStatus.ts
function decideAiStatus(settings, analysis, aiError) {
  if (!settings.aiEnabled) return "skipped";
  if (!hasAiConfig(settings)) return "missing_config";
  if (aiError) return "failed";
  if (analysis.topic) return "ok";
  if (analysis.summary) return "ok";
  if (analysis.tags && analysis.tags.length > 0) return "ok";
  return "failed";
}

// src/importer/noteFormatting.ts
function composeWeChatNote(meta, body, analysis) {
  const lines = ["---", `source: ${meta.url}`];
  if (meta.title) lines.push(`title: "${escapeYamlString(meta.title)}"`);
  if (meta.account) lines.push(`account: "${escapeYamlString(meta.account)}"`);
  if (meta.author) lines.push(`author: "${escapeYamlString(meta.author)}"`);
  if (meta.publishDate) lines.push(`publish_time: ${meta.publishDate}`);
  if (analysis.topic) lines.push(`topic: "${escapeYamlString(analysis.topic)}"`);
  if (analysis.tags && analysis.tags.length > 0) {
    lines.push("tags:");
    for (const t of analysis.tags) {
      lines.push(`  - ${t}`);
    }
  }
  lines.push("---", "", "");
  const aiBlock = analysis.summary ? formatAiSummaryCallout(analysis.summary) : "";
  return lines.join("\n") + aiBlock + body.trimEnd() + "\n";
}
function formatAiSummaryCallout(summary) {
  const normalized = summary.trim().replaceAll(/\r\n/g, "\n");
  const parts = normalized.split("\n").map((s) => s.trim()).filter((s) => s.length > 0);
  const outLines = ["> [!summary] AI \u603B\u7ED3", ...parts.map((p) => `> ${p}`), ""];
  return outLines.join("\n") + "\n";
}
function escapeYamlString(s) {
  return s.replaceAll(/"/g, '\\"');
}

// src/importer/importWeChatArticle.ts
async function importWeChatArticle(args) {
  const html = await fetchHtml(args.url, args.settings.userAgent);
  const extracted = extractArticle(args.url, html);
  cleanWeChatContent(extracted.contentEl, {
    trimTailEnabled: args.settings.trimTailEnabled,
    trimTailKeywords: args.settings.trimTailKeywords
  });
  const title = extracted.meta.title ?? "untitled";
  const noteStem = sanitizeFileStem(title);
  const mdBody = htmlToMarkdown(extracted.contentEl);
  let aiError = false;
  const aiPromise = args.settings.aiEnabled ? analyzeArticleWithOpenAICompatible({ title, markdown: mdBody, settings: args.settings }).catch(() => {
    aiError = true;
    return {};
  }) : Promise.resolve({});
  const localizePromise = localizeImages({
    vault: args.app.vault,
    markdown: mdBody,
    noteFolder: args.settings.noteFolder,
    assetFolder: args.settings.assetFolder,
    noteStem,
    referer: args.url,
    userAgent: args.settings.userAgent,
    requestUrl: async (req) => {
      const res = await (0, import_obsidian4.requestUrl)(req);
      return {
        headers: res.headers,
        arrayBuffer: res.arrayBuffer
      };
    }
  });
  const [analysis, localized] = await Promise.all([aiPromise, localizePromise]);
  const notePath = await writeNote(args.app, {
    folder: args.settings.noteFolder,
    stem: noteStem,
    publishDate: extracted.meta.publishDate,
    content: composeWeChatNote(extracted.meta, localized.markdown, analysis)
  });
  const aiStatus = decideAiStatus(args.settings, analysis, aiError);
  return { notePath, imageTotal: localized.imageTotal, imageFailed: localized.imageFailed, aiStatus };
}
async function writeNote(app, input) {
  const folder = input.folder.trim().replaceAll(/\/+$/g, "");
  if (folder) await ensureFolder2(app, folder);
  const baseName = ensureMdExt(input.stem);
  const basePath = folder ? joinPosix(folder, baseName) : baseName;
  const existing = app.vault.getAbstractFileByPath(basePath);
  if (!existing) {
    await app.vault.create(basePath, input.content);
    return basePath;
  }
  const suffix = input.publishDate ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const altName = ensureMdExt(`${input.stem} - ${suffix}`);
  const altPath = folder ? joinPosix(folder, altName) : altName;
  await app.vault.create(altPath, input.content);
  return altPath;
}
async function ensureFolder2(app, folderPath) {
  const parts = joinPosix(folderPath).split("/").filter(Boolean);
  let acc = "";
  for (const part of parts) {
    acc = acc ? `${acc}/${part}` : part;
    if (app.vault.getAbstractFileByPath(acc)) continue;
    await app.vault.createFolder(acc);
  }
}

// src/main.ts
var WeChatClipperPlugin = class extends import_obsidian5.Plugin {
  settings = DEFAULT_SETTINGS;
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new WeChatClipperSettingTab(this.app, this));
    this.addCommand({
      id: "import-wechat-article-from-url",
      name: "Import WeChat Article from URL",
      callback: async () => {
        const url = await new UrlInputModal(this).openAndGet();
        if (!url) return;
        await this.runImport(url);
      }
    });
  }
  async loadSettings() {
    const loaded = await this.loadData();
    this.settings = { ...DEFAULT_SETTINGS, ...loaded ?? {} };
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  async runImport(url) {
    try {
      const out = await importWeChatArticle({ app: this.app, url, settings: this.settings });
      const ai = formatAiStatus(out.aiStatus);
      const msg = out.imageFailed > 0 ? `Imported: ${out.notePath} (images: ${out.imageTotal}, failed: ${out.imageFailed}${ai})` : `Imported: ${out.notePath} (images: ${out.imageTotal}${ai})`;
      new import_obsidian5.Notice(msg);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      new import_obsidian5.Notice(`Import failed: ${msg}`);
    }
  }
};
function formatAiStatus(aiStatus) {
  if (!aiStatus || aiStatus === "skipped") return "";
  if (aiStatus === "missing_config") return ", AI: missing config";
  return `, AI: ${aiStatus}`;
}
var UrlInputModal = class extends import_obsidian5.Modal {
  plugin;
  resolve;
  value = "";
  constructor(plugin) {
    super(plugin.app);
    this.plugin = plugin;
  }
  openAndGet() {
    this.open();
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "WeChat Article URL" });
    new import_obsidian5.Setting(contentEl).addText(
      (text) => text.setPlaceholder("https://mp.weixin.qq.com/s/...").onChange((v) => {
        this.value = v.trim();
      })
    );
    new import_obsidian5.Setting(contentEl).addButton(
      (btn) => btn.setButtonText("Import").setCta().onClick(() => {
        this.close();
        this.resolve?.(this.value || null);
      })
    );
  }
  onClose() {
    this.resolve?.(this.value || null);
  }
};
