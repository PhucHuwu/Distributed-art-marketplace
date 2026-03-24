const baseUrl = process.env.BASE_URL || 'http://localhost';

const checks = [
  ['gateway health', '/health'],
  ['auth health via gateway', '/api/auth/health'],
  ['auth docs via gateway', '/api/auth/docs'],
  ['auth openapi via gateway', '/api/auth/openapi.json'],
  ['users health via gateway', '/api/users/health'],
  ['users docs via gateway', '/api/users/docs'],
  ['users openapi via gateway', '/api/users/openapi.json'],
  ['catalog health via gateway', '/api/catalog/health'],
  ['catalog docs via gateway', '/api/catalog/docs'],
  ['catalog openapi via gateway', '/api/catalog/openapi.json'],
  ['inventory health via gateway', '/api/inventory/health'],
  ['inventory docs via gateway', '/api/inventory/docs'],
  ['inventory openapi via gateway', '/api/inventory/openapi.json'],
  ['orders health via gateway', '/api/orders/health'],
  ['orders docs via gateway', '/api/orders/docs'],
  ['orders openapi via gateway', '/api/orders/openapi.json'],
  ['payments health via gateway', '/api/payments/health'],
  ['payments docs via gateway', '/api/payments/docs'],
  ['payments openapi via gateway', '/api/payments/openapi.json'],
  ['notifications health via gateway', '/api/notifications/health'],
  ['notifications docs via gateway', '/api/notifications/docs'],
  ['notifications openapi via gateway', '/api/notifications/openapi.json'],
  ['audit health via gateway', '/api/admin/audit-logs/health'],
  ['audit docs via gateway', '/api/admin/audit-logs/docs'],
  ['audit openapi via gateway', '/api/admin/audit-logs/openapi.json'],
];

async function checkEndpoint(name, path) {
  const url = `${baseUrl}${path}`;
  process.stdout.write(`Checking ${name}: ${url}\n`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`FAIL ${name} (${response.status})`);
  }

  process.stdout.write(`PASS ${name}\n`);
}

async function run() {
  for (const [name, path] of checks) {
    await checkEndpoint(name, path);
  }

  process.stdout.write('Smoke checks completed successfully.\n');
}

run().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
