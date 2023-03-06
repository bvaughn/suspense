import {
  forwardRef,
  InputHTMLAttributes,
  KeyboardEvent,
  MutableRefObject,
  useRef,
} from "react";

import Icon from "../../../components/Icon";
import { ApiClient, itemsCache } from "./index";
import styles from "./style.module.css";

function InputInner({
  disabled,
  forwardedRef,
  onEnter,
  ...rest
}: {
  forwardedRef: MutableRefObject<HTMLInputElement>;
} & InputHTMLAttributes<HTMLInputElement> & { onEnter: () => void }) {
  const onClick = () => {
    forwardedRef.current?.focus();
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
        {...rest}
        className={styles.Input}
        disabled={disabled}
        onKeyDown={onKeyDown}
        placeholder="What needs to be done?"
        ref={forwardedRef}
      />
    </div>
  );
}

const Input = forwardRef(
  (
    props: InputHTMLAttributes<HTMLInputElement> & { onEnter: () => void },
    ref: MutableRefObject<HTMLInputElement>
  ) => {
    return <InputInner forwardedRef={ref} {...props} />;
  }
);

// REMOVE_BEFORE

import { useCacheMutation } from "suspense";

function AddItem({ apiClient }: { apiClient: ApiClient }) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Pass the cache we want to mutate
  const { isPending, mutateAsync } = useCacheMutation(itemsCache);

  const addItem = async () => {
    const input = inputRef.current;
    if (input.value) {
      mutateAsync([apiClient], async () => {
        // Add the new item to the remote list (async)
        const newItems = await apiClient.addItem({
          body: input.value,
          complete: false,
        });

        // Clear the input field once the new item has been added
        inputRef.current!.value = "";

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
