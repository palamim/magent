export const extractLastJson = (text: string): string | null => {
  const starts: number[] = [];
  for (let i = 0; i < text.length; i++) if (text[i] === '{') starts.push(i);

  for (let i = starts.length - 1; i >= 0; i--) {
    const candidate = text.slice(starts[i]);
    let depth = 0;
    for (let j = 0; j < candidate.length; j++) {
      if (candidate[j] === '{') depth++;
      else if (candidate[j] === '}') {
        depth--;
        if (depth === 0) {
          const slice = candidate.slice(0, j + 1);
          try {
            JSON.parse(slice);
            return slice;
          } catch {
            break;
          }
        }
      }
    }
  }
  return null;
};
