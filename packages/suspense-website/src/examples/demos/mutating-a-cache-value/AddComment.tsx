import {
  ButtonHTMLAttributes,
  forwardRef,
  InputHTMLAttributes,
  KeyboardEvent,
  MutableRefObject,
  useRef,
  useState,
} from "react";

import Icon from "../../../components/Icon";
import { ApiClient, commentsCache } from "./index";
import styles from "./style.module.css";

function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={styles.Button} />;
}

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
        placeholder="New comment"
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

function AddComment({ apiClient }: { apiClient: ApiClient }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [isPending, mutate] = useCacheMutation(commentsCache);

  const addComment = async () => {
    const input = inputRef.current;
    if (input.value) {
      // The mutate function will schedule an update with React
      // Any components using the cache will re-render after the mutation
      await mutate({
        mutate: async (cache) => {
          input.disabled = true;

          // The "mutate" callback performs external mutations (e.g. API calls)
          const newComments = await apiClient.addComment(input.value);

          // Pre-cache any values we know about after mutation
          // to avoid re-fetching when React updates
          cache(newComments, apiClient);
        },
        effect: async () => {
          // The optional "effect" callback can do clean-up work
          // e.g. reset the text input after the comment is created
          input.disabled = false;
          input.value = "";
        },
      });
    }
  };

  return (
    <>
      <Input
        disabled={isPending}
        onEnter={addComment}
        placeholder="New comment"
        ref={inputRef}
      />
      <Button disabled={isPending} onClick={addComment}>
        Save
      </Button>
    </>
  );
}

// REMOVE_AFTER

export { AddComment };
