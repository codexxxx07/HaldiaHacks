#!/usr/bin/env node

// Dev static server with automatic port selection.
//
// Reuses the existing `serve` dependency (no new packages) and, instead of
// letting `serve` crash with EADDRINUSE, picks the first free port starting
// from the desired one (3001, 3002, 3003, ...). Existing processes are left
// untouched -- we only ever look for a port that is not in use.

const net = require('net');
const path = require('path');
const { spawn } = require('child_process');

const START_PORT = Number(process.env.PORT) || 3001;
const MAX_PORT = 65535;

// Resolve the local `serve` binary that is already installed.
const servePackage = require.resolve('serve/package.json');
const serveBin = path.join(path.dirname(servePackage), 'bin', 'serve.js');

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const tester = net.createServer();

    tester.once('error', () => resolve(false));
    tester.once('listening', () => tester.close(() => resolve(true)));

    // No host argument: matches how `serve` binds (all interfaces).
    tester.listen(port);
  });
}

async function findAvailablePort(startPort) {
  for (let port = startPort; port <= MAX_PORT; port += 1) {
    // eslint-disable-next-line no-await-in-loop
    if (await isPortAvailable(port)) {
      return port;
    }
  }

  throw new Error(`No available port found starting from ${startPort}.`);
}

(async () => {
  let port;

  try {
    port = await findAvailablePort(START_PORT);
  } catch (err) {
    console.error(`ERROR: ${err.message}`);
    process.exit(1);
  }

  if (port !== START_PORT) {
    console.log(`Port ${START_PORT} is already in use, switching to ${port}...`);
  }

  console.log(`\n> Local: http://localhost:${port}\n`);

  const child = spawn(process.execPath, [serveBin, '.', '-l', String(port)], {
    stdio: 'inherit',
  });

  child.on('error', (err) => {
    console.error(`ERROR: Failed to start server: ${err.message}`);
    process.exit(1);
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code === null ? 0 : code);
    }
  });

  ['SIGINT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, () => child.kill(signal));
  });
})();
