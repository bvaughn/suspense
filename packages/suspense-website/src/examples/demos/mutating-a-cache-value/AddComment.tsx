import {
  forwardRef,
  InputHTMLAttributes,
  KeyboardEvent,
  MutableRefObject,
  useRef,
} from "react";

import Icon from "../../../components/Icon";
import { ApiClient, commentsCache } from "./index";
import styles from "./style.module.css";
import { SaveButton } from "./SaveButton";

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

  const { isPending, mutateAsync } = useCacheMutation(commentsCache);

  const addComment = async () => {
    const input = inputRef.current;
    if (input.value) {
      mutateAsync([apiClient], async () => {
        const newComments = await apiClient.addComment(input.value);

        // TODO Re-think this aspect of the API; is it safe?
        inputRef.current!.value = "";

        return newComments;
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
      <SaveButton isPending={isPending} onClick={addComment} />
    </>
  );
}

// REMOVE_AFTER

export { AddComment };
