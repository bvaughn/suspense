import {
  ForwardedRef,
  forwardRef,
  KeyboardEvent,
  MutableRefObject,
  useRef,
} from "react";

import Icon from "../../../components/Icon";
import { ApiClient, itemsCache } from "./index";
import styles from "./style.module.css";

const Input = forwardRef(
  (
    {
      disabled,
      onEnter,
      placeholder,
    }: {
      disabled: boolean;
      onEnter: () => void;
      placeholder: string;
    },
    ref: ForwardedRef<HTMLInputElement>
  ) => {
    const onClick = () => {
      (ref as MutableRefObject<HTMLInputElement>).current.focus();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "Enter":
          onEnter();
          break;
      }
    };

    return (
      <div
        className={styles.InputRow}
        data-disabled={disabled || undefined}
        onClick={onClick}
      >
        <Icon type="edit" />
        <input
          className={styles.Input}
          disabled={disabled}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          ref={ref}
        />
      </div>
    );
  }
);

// REMOVE_BEFORE

import { useCacheMutation } from "suspense";

function AddItem({ apiClient }: { apiClient: ApiClient }) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Pass the cache we want to mutate to the mutation hook
  const { isPending, mutateAsync } = useCacheMutation(itemsCache);

  const addItem = async () => {
    const input = inputRef.current!;
    if (input.value) {
      mutateAsync([apiClient], async () => {
        // Add the new item to the remote list (async)
        const newItems = await apiClient.addItem({
          body: input.value,
          complete: false,
        });

        // Clear the input field once the new item has been added
        inputRef.current!.value = "";

        // Pre-seed the cache with the updated list of items
        return newItems;
      });
    }
  };

  // Disable form inputs while a mutation is pending
  return (
    <Input
      disabled={isPending}
      onEnter={addItem}
      placeholder="What needs to be done?"
      ref={inputRef}
    />
  );
}

// REMOVE_AFTER

export { AddItem };
