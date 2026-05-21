# 飘流幻境新炼金百科

Vite + React 版本的炼金配方前端工程。

## 运行

```bash
npm install
npm run dev
```

## 打包

```bash
npm run build
npm run preview
```

## GitHub Pages 发布

这个项目已经按 GitHub Pages `项目页` 模式准备好了。

### 首次发布

1. 创建 GitHub 仓库并推送代码
2. 仓库里打开 `Settings > Pages`
3. Source 选择 `GitHub Actions`
4. push 到默认分支后，GitHub 会自动执行部署工作流

最终地址会是：

```text
https://<你的 GitHub 用户名>.github.io/<仓库名>/
```

### 本地发布前检查

```bash
npm run build
npm run preview
```

### 说明

- `vite.config.js` 会根据 `GITHUB_REPOSITORY` 自动推导 `base`
- 如果仓库是普通项目仓库，发布路径会自动变成 `/<仓库名>/`
- 如果以后改成用户主页仓库（`username.github.io`），路径会自动回到 `/`

## 目录

```text
src/
  data/items.json    # 物品与配方数据
  i18n/ui.json       # 界面文案三语言
  main.jsx           # 页面逻辑
  styles.css         # 页面样式
```

## 数据结构

`src/data/items.json` 里每个可翻译字段都预留了三种语言：

```json
{
  "name": {
    "zh-Hans": "黑主教袍",
    "zh-Hant": "黑主教袍",
    "en": "黑主教袍"
  }
}
```

目前 `en` 字段按你的要求先用简体中文占位，之后可以逐项替换成英文名称。繁体字段已经按当前数据做了初步转换，后续也可以人工校对。

配方材料如果有 `itemId`，页面会把它作为可点击材料进入下一层；如果没有 `itemId`，就只作为成品材料显示。

```json
{
  "itemId": "blue_feather_kungfu",
  "name": {
    "zh-Hans": "蓝羽功夫装",
    "zh-Hant": "藍羽功夫裝",
    "en": "蓝羽功夫装"
  }
}
```
