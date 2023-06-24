import { isDevelopment } from "#is-development";

let enabled = false;

export function disableDebugLogging(): void {
  enabled = false;
}

export function enableDebugLogging(): void {
  enabled = true;
}

export function log(enableDebugLogging = enabled, args: any[]) {
  if (isDevelopment) {
    if (enableDebugLogging) {
      console.log(...args);
    }
  }
}
