import { freeLocalPort, frontendPort } from './_shared.mjs';

process.env.BACKEND_RUNTIME = 'python';
process.env.BACKEND_PORT = process.env.BACKEND_PORT || '5000';
process.env.ENABLE_BACKGROUND_SCHEDULER = 'false';

freeLocalPort(frontendPort);
freeLocalPort(process.env.BACKEND_PORT);

await import('./dev.mjs');
