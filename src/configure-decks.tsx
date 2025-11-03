import {
  Action,
  ActionPanel,
  Alert,
  confirmAlert,
  Form,
  Icon,
  List,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { checkAnkiConnection, getDecks, DeckInfo } from "./ankiConnect";
import { getDeckMappings, addDeckMapping, removeDeckMapping, DeckMapping } from "./storage";

export default function ConfigureDecks() {
  const [mappings, setMappings] = useState<DeckMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ankiConnected, setAnkiConnected] = useState(false);

  useEffect(() => {
    loadMappings();
  }, []);

  async function loadMappings() {
    try {
      setIsLoading(true);

      // Check Anki connection
      const connected = await checkAnkiConnection();
      setAnkiConnected(connected);

      // Load mappings
      const storedMappings = await getDeckMappings();
      setMappings(storedMappings);
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to load deck mappings",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRemoveMapping(deckId: number) {
    const confirmed = await confirmAlert({
      title: "Remove Deck Mapping",
      message: "Are you sure you want to remove this deck mapping?",
      primaryAction: {
        title: "Remove",
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (confirmed) {
      try {
        await removeDeckMapping(deckId);
        await showToast({
          style: Toast.Style.Success,
          title: "Deck mapping removed",
        });
        await loadMappings();
      } catch (error) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Failed to remove deck mapping",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }

  if (!ankiConnected) {
    return (
      <List>
        <List.EmptyView
          icon={Icon.Warning}
          title="Cannot connect to Anki"
          description="Make sure Anki is running and AnkiConnect plugin is installed (code: 2055492159)"
        />
      </List>
    );
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search deck mappings...">
      <List.EmptyView
        icon={Icon.Document}
        title="No Deck Mappings"
        description="Add a deck mapping to get started"
        actions={
          <ActionPanel>
            <Action.Push
              title="Add Deck Mapping"
              icon={Icon.Plus}
              target={<AddDeckMappingForm onMappingAdded={loadMappings} />}
            />
          </ActionPanel>
        }
      />

      {mappings.map((mapping) => (
        <List.Item
          key={mapping.deckId}
          title={mapping.deckName}
          subtitle={mapping.purpose}
          icon={Icon.Book}
          accessories={[{ text: `ID: ${mapping.deckId}` }]}
          actions={
            <ActionPanel>
              <Action.Push
                title="Edit Configuration"
                icon={Icon.Pencil}
                target={<EditDeckMappingForm mapping={mapping} onMappingUpdated={loadMappings} />}
              />
              <Action.Push
                title="Add Deck Mapping"
                icon={Icon.Plus}
                target={<AddDeckMappingForm onMappingAdded={loadMappings} />}
              />
              <Action
                title="Remove Deck Mapping"
                icon={Icon.Trash}
                style={Action.Style.Destructive}
                onAction={() => handleRemoveMapping(mapping.deckId)}
                shortcut={{ modifiers: ["cmd"], key: "backspace" }}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

interface AddDeckMappingFormProps {
  onMappingAdded: () => Promise<void>;
}

function AddDeckMappingForm({ onMappingAdded }: AddDeckMappingFormProps) {
  const { pop } = useNavigation();
  const [decks, setDecks] = useState<DeckInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [existingMappings, setExistingMappings] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadDecks();
  }, []);

  async function loadDecks() {
    try {
      setIsLoading(true);

      // Load available decks from Anki
      const availableDecks = await getDecks();
      setDecks(availableDecks);

      // Load existing mappings to filter them out
      const mappings = await getDeckMappings();
      setExistingMappings(new Set(mappings.map((m) => m.deckId)));
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to load decks",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(values: {
    deckId: string;
    purpose: string;
    noteType: string;
    frontTemplate: string;
    backTemplate: string;
    frontExample: string;
    backExample: string;
  }) {
    if (
      !values.deckId ||
      !values.purpose.trim() ||
      !values.noteType ||
      !values.frontTemplate.trim() ||
      !values.backTemplate.trim() ||
      !values.frontExample.trim() ||
      !values.backExample.trim()
    ) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid input",
        message: "Please fill in all required fields",
      });
      return;
    }

    const deckId = parseInt(values.deckId, 10);
    const deck = decks.find((d) => d.id === deckId);

    if (!deck) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Deck not found",
      });
      return;
    }

    try {
      await addDeckMapping({
        deckId: deck.id,
        deckName: deck.name,
        purpose: values.purpose.trim(),
        noteType: values.noteType as "Basic" | "Basic (and reversed card)",
        frontTemplate: values.frontTemplate.trim(),
        backTemplate: values.backTemplate.trim(),
        frontExample: values.frontExample.trim(),
        backExample: values.backExample.trim(),
      });

      await showToast({
        style: Toast.Style.Success,
        title: "Deck mapping added",
      });

      pop();
      await onMappingAdded();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to add deck mapping",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Filter out decks that already have mappings
  const availableDecks = decks.filter((deck) => !existingMappings.has(deck.id));

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Add Mapping" icon={Icon.Plus} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="deckId" title="Deck" placeholder="Select a deck">
        {availableDecks.length === 0 ? (
          <Form.Dropdown.Item value="" title="No available decks (all are already mapped)" />
        ) : (
          availableDecks.map((deck) => <Form.Dropdown.Item key={deck.id} value={deck.id.toString()} title={deck.name} />)
        )}
      </Form.Dropdown>

      <Form.TextField
        id="purpose"
        title="Purpose"
        placeholder="e.g., for Japanese vocabulary"
        info="Describe what this deck is for to help AI select the right deck"
      />

      <Form.Dropdown id="noteType" title="Note Type" info="Card type to use for this deck">
        <Form.Dropdown.Item value="Basic" title="Basic" />
        <Form.Dropdown.Item value="Basic (and reversed card)" title="Basic (and reversed card)" />
      </Form.Dropdown>

      <Form.TextArea
        id="frontTemplate"
        title="Front Template"
        placeholder="e.g., Japanese word in hiragana with romaji in parentheses"
        info="Describe how the front of the card should be formatted"
      />

      <Form.TextArea
        id="backTemplate"
        title="Back Template"
        placeholder="e.g., English translation with example sentence"
        info="Describe how the back of the card should be formatted"
      />

      <Form.TextArea
        id="frontExample"
        title="Front Example"
        placeholder="e.g., 食べる (taberu)"
        info="Show an example of a front card"
      />

      <Form.TextArea
        id="backExample"
        title="Back Example"
        placeholder="e.g., to eat - Example: 私は朝ごはんを食べます"
        info="Show an example of a back card"
      />
    </Form>
  );
}

interface EditDeckMappingFormProps {
  mapping: DeckMapping;
  onMappingUpdated: () => Promise<void>;
}

function EditDeckMappingForm({ mapping, onMappingUpdated }: EditDeckMappingFormProps) {
  const { pop } = useNavigation();
  const [decks, setDecks] = useState<DeckInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [existingMappings, setExistingMappings] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadDecks();
  }, []);

  async function loadDecks() {
    try {
      setIsLoading(true);

      const availableDecks = await getDecks();
      setDecks(availableDecks);

      const mappings = await getDeckMappings();
      // Exclude current deck from the "already mapped" set so it appears in the dropdown
      setExistingMappings(new Set(mappings.filter((m) => m.deckId !== mapping.deckId).map((m) => m.deckId)));
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to load decks",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(values: {
    deckId: string;
    purpose: string;
    noteType: string;
    frontTemplate: string;
    backTemplate: string;
    frontExample: string;
    backExample: string;
  }) {
    if (
      !values.deckId ||
      !values.purpose.trim() ||
      !values.noteType ||
      !values.frontTemplate.trim() ||
      !values.backTemplate.trim() ||
      !values.frontExample.trim() ||
      !values.backExample.trim()
    ) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid input",
        message: "Please fill in all required fields",
      });
      return;
    }

    const newDeckId = parseInt(values.deckId, 10);
    const deck = decks.find((d) => d.id === newDeckId);

    if (!deck) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Deck not found",
      });
      return;
    }

    try {
      // If deck changed, remove old mapping first
      if (newDeckId !== mapping.deckId) {
        await removeDeckMapping(mapping.deckId);
      }

      await addDeckMapping({
        deckId: deck.id,
        deckName: deck.name,
        purpose: values.purpose.trim(),
        noteType: values.noteType as "Basic" | "Basic (and reversed card)",
        frontTemplate: values.frontTemplate.trim(),
        backTemplate: values.backTemplate.trim(),
        frontExample: values.frontExample.trim(),
        backExample: values.backExample.trim(),
      });

      await showToast({
        style: Toast.Style.Success,
        title: "Configuration updated",
      });

      pop();
      await onMappingUpdated();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to update configuration",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  const availableDecks = decks.filter((deck) => !existingMappings.has(deck.id));

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Update Configuration" icon={Icon.Check} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="deckId" title="Deck" defaultValue={mapping.deckId.toString()}>
        {availableDecks.map((deck) => (
          <Form.Dropdown.Item key={deck.id} value={deck.id.toString()} title={deck.name} />
        ))}
      </Form.Dropdown>

      <Form.TextField
        id="purpose"
        title="Purpose"
        placeholder="e.g., for Japanese vocabulary"
        defaultValue={mapping.purpose}
        info="Describe what this deck is for to help AI select the right deck"
      />

      <Form.Dropdown id="noteType" title="Note Type" defaultValue={mapping.noteType} info="Card type to use for this deck">
        <Form.Dropdown.Item value="Basic" title="Basic" />
        <Form.Dropdown.Item value="Basic (and reversed card)" title="Basic (and reversed card)" />
      </Form.Dropdown>

      <Form.TextArea
        id="frontTemplate"
        title="Front Template"
        placeholder="e.g., Japanese word in hiragana with romaji in parentheses"
        defaultValue={mapping.frontTemplate}
        info="Describe how the front of the card should be formatted"
      />

      <Form.TextArea
        id="backTemplate"
        title="Back Template"
        placeholder="e.g., English translation with example sentence"
        defaultValue={mapping.backTemplate}
        info="Describe how the back of the card should be formatted"
      />

      <Form.TextArea
        id="frontExample"
        title="Front Example"
        placeholder="e.g., 食べる (taberu)"
        defaultValue={mapping.frontExample}
        info="Show an example of a front card"
      />

      <Form.TextArea
        id="backExample"
        title="Back Example"
        placeholder="e.g., to eat - Example: 私は朝ごはんを食べます"
        defaultValue={mapping.backExample}
        info="Show an example of a back card"
      />
    </Form>
  );
}
