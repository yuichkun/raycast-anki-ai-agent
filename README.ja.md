# Anki AI Agent

🌐 [English](./README.md) | [简体中文](./README.zh-CN.md)

RaycastでAIと自然な会話をしながらAnkiフラッシュカードを作成できます。

- [Anki AI Agent](#anki-ai-agent)
  - [スクリーンショット](#スクリーンショット)
  - [インストール](#インストール)
    - [1. Organizationに参加](#1-organizationに参加)
    - [2. 拡張機能をインストール](#2-拡張機能をインストール)
  - [セットアップ](#セットアップ)
    - [1. 必要なソフトウェア](#1-必要なソフトウェア)
    - [2. デッキの設定](#2-デッキの設定)
      - [設定例: 日本語単語デッキ](#設定例-日本語単語デッキ)
    - [3. カードを作成](#3-カードを作成)
  - [機能](#機能)
  - [設定のエクスポート/インポート](#設定のエクスポートインポート)
    - [エクスポート](#エクスポート)
    - [インポート](#インポート)

## スクリーンショット

![AI Chatでカード作成](./metadata/ai-chat.png)
![Ankiのカード](./metadata/anki.png)

## インストール

この拡張機能は **Anki AI Agent** Raycast organizationのプライベートストアで公開されています。

### 1. Organizationに参加

以下の招待リンクをクリックして参加してください:

**[👉 Anki AI Agent Organizationに参加](https://www.raycast.com/invite/846fd68b)**

![join-organization](./metadata/accept-invitation.png)

### 2. 拡張機能をインストール

1. Raycastを開いて **Store** コマンドを実行
2. **Anki AI Agent** チームでフィルター（ドロップダウンから選択）
3. "Anki AI Agent" を選んで `Enter` でインストール

![install](./metadata/install.jpg)

## セットアップ

### 1. 必要なソフトウェア

- **[Anki Desktop](https://apps.ankiweb.net/)** - この拡張機能の使用中は起動している必要があります
- **[AnkiConnect プラグイン](https://ankiweb.net/shared/info/2055492159)** - Ankiにインストール (コード: `2055492159`)
- **Raycast AI** - [Raycast Pro](https://www.raycast.com/pro) サブスクリプション、または [BYOK (Bring Your Own Key)](https://manual.raycast.com/ai) で自分のAPIキーを設定

### 2. デッキの設定

Raycastで **"Configure Anki Decks"** コマンドを実行して、各デッキを設定します:
![Deck Configuration List](./metadata/deck-configuration-list.png)
![Deck Configuration Form](./metadata/deck-configuration-detail.png)

#### 設定例: 日本語単語デッキ

日本語単語デッキの設定例です:

**Purpose:**
```
Japanese vocabulary words with readings and example sentences
```

**Front Template:**
```
Japanese Word
[Reading]

Example Sentences:
- Sentence 1
- Sentence 2
```

**Front Example:**
```
食べる
[たべる]

Example Sentences:
- 朝ごはんを食べる。
- 寿司を食べたい。
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
- (I eat breakfast.)
- (I want to eat sushi.)

Notes:
Ichidan verb (る-verb). One of the most common verbs in Japanese.

Related: 食事 (meal), 食べ物 (food)
```

この構造化されたアプローチにより、AIがカードを正確にフォーマットできます。必要に応じてシンプルなテンプレートも複雑なテンプレートも使用できます。

---

デッキを設定する際に入力する項目:

**Deck** - Ankiコレクションから既存のデッキを選択（例: `Japanese::Vocabulary`）

**Note Type** - カードの形式を選択:
- **Basic** - 片面カード（表 → 裏のみ）
- **Basic (and reversed card)** - 両面カード（表 → 裏 と 裏 → 表 の両方）

**Purpose, Templates, Examples** - 上記の例に従ってください。AIはテンプレートと例をフォーマットのガイドラインとして使用します。

### 3. カードを作成

Raycast AI Chatで `@anki-ai-agent` をメンションします:

```
@anki-ai-agent 「食べる」のカードを追加して
```

```
@anki-ai-agent 以下の日本語単語を追加して: 飲む、走る、読む
```

```
@anki-ai-agent て形の活用についてのカードを作成して
```

AIは以下を行います:
1. 設定に基づいて適切なデッキを選択
2. テンプレートに従ってカードをフォーマット
3. 重複をチェック
4. 作成前に確認を求める

## 機能

- **AI駆動のデッキ選択** - コンテンツに基づいて適切なデッキを自動選択
- **スマートフォーマット** - AIがテンプレートとガイドラインに従ってフォーマット
- **Markdownサポート** - **太字**、*斜体*、`コード`、リストをカードフィールドで使用可能
- **重複検出** - 類似カードが既に存在する場合に警告
- **バッチ操作** - 1つのメッセージで複数のカードを作成
- **確認ダイアログ** - 各カード作成前にレビュー
- **設定のエクスポート/インポート** - デッキ設定のバックアップと共有

## 設定のエクスポート/インポート

デッキ設定をエクスポートして他の人と共有したり、バックアップしたりできます。

### エクスポート

- **すべてエクスポート**: デッキリストで "Export All Configurations" を選択 (`Cmd+Shift+E` / `Ctrl+Shift+E`)
- **単一エクスポート**: 編集フォームで "Export This Configuration" を選択 (`Cmd+E` / `Ctrl+E`)

設定はJSON形式でクリップボードにコピーされます。

### インポート

- **すべてインポート**: デッキリストで "Import Configurations" を選択 (`Cmd+Shift+I` / `Ctrl+Shift+I`)
- **単一インポート**: 編集フォームで "Import Configuration" を選択 (`Cmd+I` / `Ctrl+I`)

JSON設定を貼り付けてインポートを実行します。同じデッキIDの既存設定は上書きされます。
