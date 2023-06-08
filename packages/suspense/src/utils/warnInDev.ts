import { isDevelopment } from "#is-development";

export function warnInDev(expectedCondition: boolean, message: string) {
  if (isDevelopment) {
    if (!expectedCondition) {
      console.warn(message);
    }
  }
}
