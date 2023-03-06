import { KeyboardEvent, Suspense, useMemo, useRef, useState } from "react";
import Icon from "../../../components/Icon";

import styles from "./style.module.css";

// Fake API data
import { createSingleEntryCache, useCacheMutation } from "suspense";
import Loader from "../../../components/Loader";
import { AddItem } from "./AddItem";

type Item = { body: string; complete: boolean; id: number };

const initialItems: Item[] = [
  { complete: true, id: 1, body: "Read the documentation" },
  { complete: false, id: 2, body: "Write a test app" },
];

export type ApiClient = {
  addItem: (partialItem: Partial<Item>) => Promise<Item[]>;
  deleteItem: (itemId: number) => Promise<Item[]>;
  editItem: (id: number, partialItem: Partial<Item>) => Promise<Item[]>;
  fetchItems: () => Promise<Item[]>;
};

export const itemsCache = createSingleEntryCache<[ApiClient], Item[]>({
  debugLabel: "Items",
  load: async (client: ApiClient) => client.fetchItems(),
});

function createDummyApiClient(): ApiClient {
  // Simulate remote state
  const additions: Item[] = [];
  const deletions: Set<number> = new Set();
  const edits: Map<number, Partial<Item>> = new Map();

  let id = initialItems.reduce((max, item) => Math.max(max, item.id), 0);

  const apiClient: ApiClient = {
    addItem: async (partialItem: Partial<Item>) => {
      id++;
      additions.push({
        body: "",
        complete: false,
        ...partialItem,
        id,
      });

      return await apiClient.fetchItems();
    },
    deleteItem: async (itemId: number) => {
      deletions.add(itemId);

      return await apiClient.fetchItems();
    },
    editItem: async (id: number, partialItem: Partial<Item>) => {
      edits.set(id, partialItem);

      return await apiClient.fetchItems();
    },
    fetchItems: async () => {
      // Simulate network latency
      await new Promise((resolve) => setTimeout(resolve, 1_000));

      return initialItems
        .concat(...additions)
        .filter((item) => !deletions.has(item.id))
        .map((item) => {
          const editedItem = edits.get(item.id) ?? {};
          return { ...item, ...editedItem };
        });
    },
  };

  return apiClient;
}

export default function Demo() {
  const apiClient = useMemo<ApiClient>(createDummyApiClient, []);

  return (
    <Suspense fallback={<Loader />}>
      <ItemsSuspends apiClient={apiClient} />
    </Suspense>
  );
}

function ItemsSuspends({ apiClient }: { apiClient: ApiClient }) {
  const items = itemsCache.read(apiClient);

  return (
    <div className={styles.Items}>
      <>
        <div />
        <AddItem apiClient={apiClient} />
        <div />
      </>
      {items.map((item) => (
        <Item apiClient={apiClient} item={item} key={item.id} />
      ))}
    </div>
  );
}

function Item({ apiClient, item }: { apiClient: ApiClient; item: Item }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const { isPending, mutateAsync } = useCacheMutation(itemsCache);

  const editItem = () => {
    const body = inputRef.current!.value;
    if (!body) {
      return;
    }

    mutateAsync([apiClient], () =>
      apiClient.editItem(item.id, { ...item, body })
    );
  };

  const onKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case "Enter":
        editItem();
        break;
      case "Escape":
        inputRef.current!.value = item.body;
        break;
    }
  };

  const toggleComplete = () => {
    mutateAsync([apiClient], () =>
      apiClient.editItem(item.id, { ...item, complete: !item.complete })
    );
  };

  const deleteItem = () => {
    mutateAsync([apiClient], () => apiClient.deleteItem(item.id));
  };

  const setFocus = () => {
    inputRef.current?.focus();
  };

  return (
    <>
      <button
        className={styles.Button}
        disabled={isPending}
        onClick={toggleComplete}
      >
        <Icon type={item.complete ? "complete" : "incomplete"} />
      </button>
      <div className={styles.InputRow} onClick={setFocus}>
        <Icon type="edit" />
        <input
          className={styles.Input}
          defaultValue={item.body}
          disabled={isPending}
          onKeyDown={onKeyDown}
          placeholder="What needs to be done?"
          ref={inputRef}
        />
      </div>
      <button
        className={styles.Button}
        disabled={isPending}
        onClick={deleteItem}
      >
        <Icon type="delete" />
      </button>
    </>
  );
}
