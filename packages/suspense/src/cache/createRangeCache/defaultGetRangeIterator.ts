export function defaultGetRangeIterator(start: any, end: any): Iterator<any> {
  let current = start;

  const iterator: Iterator<number> = {
    next() {
      if (current <= end) {
        const value = current;
        current++;
        return { done: false, value };
      }
      return { done: true, value: null };
    },
  };

  return iterator;
}
