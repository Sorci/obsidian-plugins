# WeChat Clipper (Obsidian Plugin)

## Features

- Import WeChat Official Account article from URL into Obsidian
- Download images into Vault and replace links
- Trim tail sections (reward/recommendation/etc.)

## Manual Install

1. Copy this folder to your vault plugins folder: `<Vault>/.obsidian/plugins/wechat-clipper/`
2. Ensure the folder contains:
   - manifest.json
   - main.js
3. Reload Obsidian and enable the plugin

## Development

```bash
cd obsidian-plugins/wechat-clipper
npm install
npm run dev
```

## Usage

Command palette → "Import WeChat Article from URL"

## Limitations

- Publicly accessible articles only (no login-required articles)

