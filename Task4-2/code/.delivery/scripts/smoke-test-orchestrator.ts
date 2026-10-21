/// <reference types="node" />

import { spawnSync } from 'node:child_process';

const args = [
    'compose',
    '--project-directory', '.',
    '-f', '.delivery/configuration/compose/compose.yaml',
    '-f', '.delivery/configuration/compose/orchestrator.compose.yaml',
    'up', '--build',
    'elasticsearch', 'zeebe', 'process', 'operate', 'payment-orchestrator',
];

console.log('Must be run in Linux/WSL with Docker installed');
console.log(`Running: docker ${args.join(' ')}`);

const result = spawnSync('/usr/bin/docker', args, { stdio: 'inherit' });

if (result.error) {
    console.error(`Could not start orchestrator smoke test: ${result.error.message}`);
    process.exitCode = 1;
} else if (result.status !== 0) {
    console.error(`Orchestrator smoke test command exited with code ${result.status ?? 'unknown'}.`);
    process.exitCode = result.status ?? 1;
}
