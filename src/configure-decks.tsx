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

  async function handleSubmit(values: { deckId: string; purpose: string }) {
    if (!values.deckId || !values.purpose.trim()) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid input",
        message: "Please select a deck and enter a purpose",
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
    </Form>
  );
}
