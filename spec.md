# Raycast Anki AI Extension Specification

## Overview

A Raycast AI extension that enables Raycast AI to add cards to Anki deck(s) in formats specified by users. The extension is primarily designed for language studying but is not limited to that use case.

## Prerequisites

- Anki desktop application installed and running
- AnkiConnect plugin installed (code: `2055492159`)
- Raycast Pro subscription (required for AI extensions)

## Core Requirements

### Must-Have Features

1. **Card Creation with Confirmation**
   - Always confirm with user before adding cards to Anki
   - Use Raycast's built-in confirmation feature

2. **Correct Deck Selection**
   - Add cards to the correct deck based on user's desired destination
   - Use pre-configured deck mapping to determine target deck

### Nice-to-Have Features (Built into the `add-card` tool)

1. **Automatic Duplicate Handling**
   - Before creating a card, check for existing similar cards
   - If found: show the existing card and offer to update or create new
   - All updates require user confirmation

## Configuration System

### Deck Configuration

- **Configuration Method**: Dedicated Raycast command with List UI (not an AI tool)
- **Storage**: JSON format in Raycast's LocalStorage
- **Mapping Structure**: Users explicitly add only the decks they want to use
- **Purpose**: Each mapped deck has a purpose description to help AI select the right deck

### User Interaction Model

- **Deck Specification**: Users specify deck in a structured way without explicitly mentioning it every time
- **Format Specification**: Card format is given in system prompt that users can configure as a preset in Raycast AI Chat
- **Card Type**: Either proposed by AI or configured in the system prompt
- **Format Support**: Up to users to decide what card formats they want to use

## Extension Components

### 1. AI Tool: `add-card`

A single AI tool that handles the entire card creation workflow:
- Receives content from user via Raycast AI
- Determines appropriate deck from pre-configured mappings
- Formats card based on user's system prompt configuration
- Automatically checks for duplicates before creating
- Shows confirmation with preview
- If duplicate found: offers to update existing or create new
- Creates or updates card in Anki via AnkiConnect

### 2. Configuration Command

A separate Raycast command (non-AI) that provides a List interface where users can:
- View their configured deck mappings
- Add new deck mappings (select deck → assign purpose)
- Remove deck mappings they no longer need
- Store mappings in Raycast's LocalStorage

Users only configure the decks they want to use, not all available decks.

### 3. Storage Layer

- **Format**: JSON
- **Location**: Raycast's extension storage
- **Contents**: Deck mappings and user preferences

## Technical Integration

### AnkiConnect Communication

The extension communicates with Anki via AnkiConnect API on:
- Host: `127.0.0.1`
- Port: `8765`
- Protocol: HTTP with JSON payloads

### Required AnkiConnect Operations

1. **Deck Operations**
   - `deckNames`: List available decks
   - `deckNamesAndIds`: Get deck identifiers

2. **Note Operations**
   - `addNote`: Create cards
   - `findNotes`: Search for duplicates
   - `updateNoteFields`: Update existing cards
   - `notesInfo`: Get card details

3. **Model Operations**
   - `modelNames`: List available note types
   - `modelFieldNames`: Get fields for note types

## User Flow

### Card Creation Flow (with built-in duplicate detection)

```mermaid
flowchart TD
    A[User provides content to Raycast AI] --> B[Tool determines deck from mapping]
    B --> C[Format card per system prompt]
    C --> D[Check for duplicates]
    D --> E{Duplicate found?}
    E -->|No| F[Show card preview]
    E -->|Yes| G[Show existing card + options]
    F --> H{User confirms?}
    G --> I{User choice}
    I -->|Update existing| J[Update card]
    I -->|Create anyway| F
    I -->|Cancel| K[Cancel operation]
    H -->|Yes| L[Add card to Anki]
    H -->|No| K
    J --> M[Success]
    L --> M
    K --> N[Operation cancelled]
```

### Configuration Flow

1. User runs the "Configure Anki Decks" command
2. Sees a List view with:
   - Currently configured deck mappings (if any)
   - Action to add new mapping
   - Actions to remove existing mappings
3. When adding a mapping:
   - Fetches available decks from Anki
   - User selects a deck from dropdown/list
   - User enters a purpose description (e.g., "for Japanese vocabulary")
   - Mapping is saved to LocalStorage
4. AI tool uses these mappings to determine the correct deck based on content

## Error Handling

### Connection Issues
- Detect if Anki is not running
- Detect if AnkiConnect is not installed
- Provide clear error messages to user

### Invalid Operations
- Validate deck exists before attempting to add cards
- Validate note type compatibility
- Handle field mapping errors

## Data Structures

### Deck Mapping Storage
```typescript
interface DeckMapping {
  deckId: string;
  deckName: string;
  purpose: string;
}
```

### Card Confirmation Data
```typescript
interface CardConfirmation {
  deck: string;
  noteType: string;
  fields: Record<string, string>;
  tags?: string[];
}
```

## Implementation Structure

The extension will include:
- One AI tool (`add-card`) configured in `package.json`
- One configuration command as a separate Raycast command
- AnkiConnect client for HTTP communication
- Storage utilities for deck mappings

## Success Criteria

- Cards are added to correct decks based on configuration
- User always confirms before cards are created
- Configuration persists between sessions
- Clear error messages when Anki or AnkiConnect unavailable
- Duplicate detection prevents unwanted duplicates