import { spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import path from 'node:path';

const projects = [
  { name: 'frontend', cwd: 'frontend' },
  { name: 'auth-service', cwd: 'services/auth-service' },
  { name: 'user-profile-service', cwd: 'services/user-profile-service' },
  { name: 'catalog-service', cwd: 'services/catalog-service' },
  { name: 'inventory-service', cwd: 'services/inventory-service' },
  { name: 'order-service', cwd: 'services/order-service' },
  { name: 'payment-service', cwd: 'services/payment-service' },
  { name: 'notification-service', cwd: 'services/notification-service' },
  { name: 'audit-log-service', cwd: 'services/audit-log-service' },
];

const rootDir = process.cwd();

function runNpmTest(project) {
  return new Promise((resolve) => {
    const startedAt = performance.now();
    const cwd = path.join(rootDir, project.cwd);
    const command = process.platform === 'win32' ? 'cmd.exe' : 'npm';
    const args = process.platform === 'win32' ? ['/d', '/s', '/c', 'npm test'] : ['test'];

    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: false,
    });

    child.on('error', () => {
      const elapsedMs = Math.round(performance.now() - startedAt);
      resolve({
        project: project.name,
        code: 1,
        elapsedMs,
      });
    });

    child.on('close', (code) => {
      const elapsedMs = Math.round(performance.now() - startedAt);
      resolve({
        project: project.name,
        code: code ?? 1,
        elapsedMs,
      });
    });
  });
}

async function run() {
  const overallStart = performance.now();
  const results = [];

  process.stdout.write('Running monorepo test suite...\n\n');

  for (const project of projects) {
    process.stdout.write(`--- ${project.name}: npm test ---\n`);
    const result = await runNpmTest(project);
    results.push(result);
    const status = result.code === 0 ? 'PASS' : 'FAIL';
    process.stdout.write(`--- ${project.name}: ${status} (${result.elapsedMs}ms) ---\n\n`);
  }

  const failed = results.filter((item) => item.code !== 0);
  const totalMs = Math.round(performance.now() - overallStart);

  process.stdout.write('Test summary:\n');
  for (const result of results) {
    const status = result.code === 0 ? 'PASS' : 'FAIL';
    process.stdout.write(`- ${result.project}: ${status} (${result.elapsedMs}ms)\n`);
  }
  process.stdout.write(`Total duration: ${totalMs}ms\n`);

  if (failed.length > 0) {
    process.stderr.write('\nFailed projects:\n');
    for (const item of failed) {
      process.stderr.write(`- ${item.project}\n`);
    }
    process.exit(1);
  }

  process.stdout.write('\nAll project tests passed.\n');
}

run().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
