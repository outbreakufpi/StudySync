import './env.js';
import app from './app.js';

const PORT = Number(process.env.PORT || 3001);

const server = app.listen(PORT, () => {
  console.log(`StudySync backend running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Free it or change backend/.env PORT.`);
    process.exit(1);
  }

  console.error('Failed to start server:', err);
  process.exit(1);
});
