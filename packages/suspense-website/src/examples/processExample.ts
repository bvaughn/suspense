export function processExample(text: string): string {
  const index = text.indexOf("REMOVE_BEFORE");
  if (index >= 0) {
    text = text.substring(index + "REMOVE_BEFORE".length);
  }

  return text.trim();
}
