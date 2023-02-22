export function warnInDev(expectedCondition: boolean, message: string) {
  if (process.env.NODE_ENV !== "production") {
    if (!expectedCondition) {
      console.warn(message);
    }
  }
}
