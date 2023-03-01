export function defaultGetKey(...params: any[]): string {
  return params.join(",");
}
