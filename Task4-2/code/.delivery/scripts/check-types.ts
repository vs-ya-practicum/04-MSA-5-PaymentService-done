/// <reference types="node" />

import { execSync } from 'node:child_process';

const commands: string[] = [
  'tsc --noEmit -p .delivery/configuration/typescript/fraudcheck.tsconfig.json',
  'tsc --noEmit -p .delivery/configuration/typescript/notification.tsconfig.json',
  'tsc --noEmit -p .delivery/configuration/typescript/orchestrator.tsconfig.json',
  'tsc --noEmit -p .delivery/configuration/typescript/payment.tsconfig.json',
  'tsc --noEmit -p .delivery/configuration/typescript/process.tsconfig.json'
];

try {
  commands.forEach((command) => {
    console.log(`Running: ${command}`);
    execSync(command, { stdio: 'inherit' });
  });
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`Error running type checks: ${errorMessage}`);
  process.exitCode = 1;
}
