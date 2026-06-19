import { execSync } from 'node:child_process';

interface VerificationResult {
  ok: boolean;
  errors: string;
}

export const typecheck = (dir: string): VerificationResult => {
  try {
    execSync('npx tsc --noEmit', { cwd: dir, stdio: 'pipe' });
    return { ok: true, errors: '' };
  } catch (error) {
    return { ok: false, errors: extractErrorOutput(error) };
  }
};

const extractErrorOutput = (error: unknown): string => {
  if (error && typeof error === 'object' && 'stdout' in error) {
    const { stdout } = error as { stdout?: Buffer | string };
    if (stdout) return stdout.toString();
  }
  return error instanceof Error ? error.message : String(error);
};
