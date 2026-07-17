import { writeDirection } from '@/project/direction';

export const approveDirection = (dir: string, direction: string): { written: boolean } => {
  writeDirection(dir, direction);
  return { written: true };
};
