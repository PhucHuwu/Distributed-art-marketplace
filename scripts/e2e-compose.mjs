import { spawn } from 'node:child_process';

const keepStack = String(process.env.E2E_KEEP_STACK || '').toLowerCase() === 'true';

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd || process.cwd(),
      stdio: 'inherit',
      shell: false,
      env: {
        ...process.env,
        ...(options.env || {}),
      },
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Command failed (${code}): ${command} ${args.join(' ')}`));
    });
  });
}

async function runNpmScript(scriptName) {
  const isWindows = process.platform === 'win32';
  const command = isWindows ? 'cmd.exe' : 'npm';
  const args = isWindows ? ['/d', '/s', '/c', `npm run ${scriptName}`] : ['run', scriptName];
  await runCommand(command, args);
}

async function runNpmScriptWithRetry(scriptName, maxAttempts, delayMs) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await runNpmScript(scriptName);
      return;
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts) {
        break;
      }

      process.stdout.write(
        `${scriptName} failed on attempt ${attempt}/${maxAttempts}, retrying in ${delayMs}ms...\n`,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function runCompose(args) {
  const isWindows = process.platform === 'win32';
  const command = isWindows ? 'cmd.exe' : 'docker';
  const commandText = `docker compose ${args.join(' ')}`;
  const commandArgs = isWindows ? ['/d', '/s', '/c', commandText] : ['compose', ...args];
  await runCommand(command, commandArgs);
}

async function runMigrationsInContainer(serviceName) {
  const isWindows = process.platform === 'win32';
  const command = isWindows ? 'cmd.exe' : 'docker';
  const composeCommand = `docker compose exec -T ${serviceName} npx prisma migrate deploy`;
  const args = isWindows ? ['/d', '/s', '/c', composeCommand] : ['compose', 'exec', '-T', serviceName, 'npx', 'prisma', 'migrate', 'deploy'];

  process.stdout.write(`Applying migrations for ${serviceName}...\n`);
  await runCommand(command, args);
}

async function run() {
  const migratedServices = [
    'auth-service',
    'user-profile-service',
    'catalog-service',
    'inventory-service',
    'order-service',
    'payment-service',
    'audit-log-service',
  ];

  try {
    process.stdout.write('Starting docker compose stack...\n');
    await runCompose(['up', '-d', '--build']);

    for (const service of migratedServices) {
      await runMigrationsInContainer(service);
    }

    process.stdout.write('Running smoke checks...\n');
    await runNpmScriptWithRetry('smoke:local', 8, 5000);

    process.stdout.write('Running E2E event-flow checks...\n');
    await runNpmScript('e2e:event-flow');

    process.stdout.write('E2E flow on docker compose passed.\n');
  } finally {
    if (keepStack) {
      process.stdout.write('E2E_KEEP_STACK=true, skipping docker compose down.\n');
      return;
    }

    process.stdout.write('Stopping docker compose stack...\n');
    try {
      await runCompose(['down']);
    } catch (error) {
      process.stderr.write(
        `${error instanceof Error ? error.message : String(error)}\n`,
      );
      process.exitCode = 1;
    }
  }
}

run().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
