# Anki AI Agent

🌐 [English](./README.md) | [日本語](./README.ja.md)

在 Raycast 中通过与 AI 自然对话来创建 Anki 闪卡。

- [Anki AI Agent](#anki-ai-agent)
  - [截图](#截图)
  - [安装](#安装)
    - [1. 加入 Organization](#1-加入-organization)
    - [2. 安装扩展](#2-安装扩展)
  - [设置](#设置)
    - [1. 安装必要软件](#1-安装必要软件)
    - [2. 配置你的牌组](#2-配置你的牌组)
      - [配置示例：中文词汇牌组](#配置示例中文词汇牌组)
    - [3. 创建卡片](#3-创建卡片)
  - [功能](#功能)
  - [导出/导入配置](#导出导入配置)
    - [导出](#导出)
    - [导入](#导入)

## 截图

![AI Chat 创建卡片](./metadata/ai-chat.png)
![Anki 中的卡片](./metadata/anki.png)

## 安装

此扩展通过 **Anki AI Agent** Raycast organization 的私有商店提供。

### 1. 加入 Organization

点击下面的邀请链接加入：

**[👉 加入 Anki AI Agent Organization](https://www.raycast.com/invite/846fd68b)**

![join-organization](./metadata/accept-invitation.png)

### 2. 安装扩展

1. 打开 Raycast 并运行 **Store** 命令
2. 通过 **Anki AI Agent** 团队筛选（使用下拉菜单）
3. 找到 "Anki AI Agent" 并按 `Enter` 安装

![install](./metadata/install.jpg)

## 设置

### 1. 安装必要软件

- **[Anki Desktop](https://apps.ankiweb.net/)** - 使用此扩展时必须运行
- **[AnkiConnect 插件](https://ankiweb.net/shared/info/2055492159)** - 在 Anki 中安装（代码：`2055492159`）
- **Raycast AI** - [Raycast Pro](https://www.raycast.com/pro) 订阅，或通过 [BYOK (Bring Your Own Key)](https://manual.raycast.com/ai) 设置自己的 API 密钥

### 2. 配置你的牌组

在 Raycast 中运行 **"Configure Anki Decks"** 命令来设置每个牌组：
![Deck Configuration List](./metadata/deck-configuration-list.png)
![Deck Configuration Form](./metadata/deck-configuration-detail.png)

#### 配置示例：中文词汇牌组

这是一个中文词汇牌组的配置示例：

**Purpose:**
```
Chinese vocabulary words with pinyin and example sentences
```

**Front Template:**
```
Chinese Word
[Pinyin]

Example Sentences:
- Sentence 1
- Sentence 2
```

**Front Example:**
```
吃
[chī]

Example Sentences:
- 我喜欢吃中国菜。
- 你吃早饭了吗？
```

**Back Template:**
```
Meanings:
- Meaning 1
- Meaning 2

Translations:
- (Translation 1)
- (Translation 2)

Notes:
Additional context or usage tips

Related: other related words
```

**Back Example:**
```
Meanings:
- to eat

Translations:
- (I like to eat Chinese food.)
- (Have you eaten breakfast?)

Notes:
One of the most common verbs in Chinese. Often used in greetings like "你吃了吗？"

Related: 吃饭 (to have a meal), 食物 (food)
```

这种结构化的方法帮助 AI 准确地格式化你的卡片。你可以根据需要使用简单或复杂的模板。

---

配置牌组时，你需要填写：

**Deck** - 从 Anki 收藏中选择现有牌组（例如：`Chinese::Vocabulary`）

**Note Type** - 选择卡片格式：
- **Basic** - 单面卡片（仅正面 → 背面）
- **Basic (and reversed card)** - 双面卡片（正面 → 背面 和 背面 → 正面）

**Purpose, Templates, Examples** - 按照上面的示例填写。AI 使用你的模板和示例作为格式化指南。

### 3. 创建卡片

在 Raycast AI Chat 中提及 `@anki-ai-agent`：

```
@anki-ai-agent 添加一张卡片：吃（chī）
```

```
@anki-ai-agent 添加这些中文词汇：喝、跑、读
```

```
@anki-ai-agent 创建一张关于把字句的卡片
```

AI 将会：
1. 根据你的配置选择合适的牌组
2. 按照模板格式化卡片
3. 检查重复
4. 创建前询问确认

## 功能

- **AI 驱动的牌组选择** - 根据内容自动选择合适的牌组
- **智能格式化** - AI 遵循你的模板指南和示例
- **Markdown 支持** - 在卡片字段中使用 **粗体**、*斜体*、`代码`、列表
- **重复检测** - 如果类似卡片已存在则发出警告
- **批量操作** - 在一条消息中创建多张卡片
- **确认对话框** - 在创建每张卡片前预览
- **导出/导入配置** - 备份和共享你的牌组设置

## 导出/导入配置

你可以导出牌组配置，与他人共享或备份你的设置。

### 导出

- **导出全部**：在牌组列表中选择 "Export All Configurations"（`Cmd+Shift+E` / `Ctrl+Shift+E`）
- **导出单个**：在编辑表单中选择 "Export This Configuration"（`Cmd+E` / `Ctrl+E`）

配置以 JSON 格式复制到剪贴板。

### 导入

- **导入全部**：在牌组列表中选择 "Import Configurations"（`Cmd+Shift+I` / `Ctrl+Shift+I`）
- **导入单个**：在编辑表单中选择 "Import Configuration"（`Cmd+I` / `Ctrl+I`）

粘贴 JSON 配置，然后运行导入。具有相同牌组 ID 的现有配置将被覆盖。
