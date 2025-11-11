# Raycast Anki AI Agent

A Raycast AI extension that lets you create Anki flashcards through natural conversation.

## Prerequisites

- [Anki](https://apps.ankiweb.net/) desktop application
- [AnkiConnect](https://ankiweb.net/shared/info/2055492159) plugin (code: `2055492159`)
- Raycast Pro subscription

## Setup

1. Install and start Anki
2. Install the AnkiConnect add-on in Anki
3. Install this extension in Raycast
4. Run the "Configure Anki Decks" command to map your decks

## Usage

### Configure Decks

Use the **Configure Anki Decks** command to:

- Add your Anki decks with templates and examples
- Define each deck's purpose (helps AI select the right deck)
- Set note types (Basic or Basic with reversed card)
- Specify front/back formatting guidelines

### Create Cards

In Raycast AI Chat, ask to create flashcards:

```
"Add a card: What is the capital of France? / Paris"
"Create a flashcard about photosynthesis"
```

The AI will:
1. Select the appropriate deck based on your configurations
2. Format the card according to your templates
3. Check for duplicates
4. Ask for confirmation before creating

## Features

- **AI-powered card creation** - Natural language to flashcard conversion
- **Markdown support** - Use bold, italic, code blocks, and lists
- **Duplicate detection** - Prevents duplicate cards
- **Multiple deck support** - Configure multiple decks with different purposes
- **Safety confirmations** - Always asks before creating cards

## Development

```bash
pnpm install
pnpm run build
```

See [spec.md](spec.md) for detailed technical documentation.