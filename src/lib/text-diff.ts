import { createTwoFilesPatch } from 'diff';

export const computeTextDiff = (filename: string, current: string, proposed: string): string =>
  createTwoFilesPatch(filename, filename, current, proposed, '', '', { context: 3 });
