import { writeConventions } from '@/project/conventions';

export const approveConventions = (dir: string, conventions: string): { written: boolean } => {
  writeConventions(dir, conventions);
  return { written: true };
};
