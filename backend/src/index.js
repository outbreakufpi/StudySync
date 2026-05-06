import './env.js';
import app from './app.js';

const DEFAULT_PORT = Number(process.env.PORT || 3001);
const MAX_PORT_ATTEMPTS = 20;

function startServer(port, attemptsLeft = MAX_PORT_ATTEMPTS) {
  const server = app.listen(port, () => {
    console.log(`StudySync backend running on port ${port}`);
    if (port !== DEFAULT_PORT) {
      console.log(`Primary port ${DEFAULT_PORT} was busy. Using fallback port ${port}.`);
    }
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE' && attemptsLeft > 0) {
      const nextPort = port + 1;
      console.warn(`Port ${port} is already in use. Trying port ${nextPort}...`);
      startServer(nextPort, attemptsLeft - 1);
      return;
    }

    if (err && err.code === 'EADDRINUSE') {
      console.error(`No available port found from ${DEFAULT_PORT} to ${port}.`);
      process.exit(1);
    }

    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

startServer(DEFAULT_PORT);
