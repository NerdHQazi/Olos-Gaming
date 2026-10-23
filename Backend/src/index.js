require('dotenv').config();
const app = require('./app');
const { startSweeper, stopSweeper } = require('./services/matchSweeper');

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (process.env.MATCH_SWEEPER_ENABLED === 'true') {
    startSweeper();
  }
});

const handleShutdown = () => {
  console.log('Shutting down server gracefully...');
  stopSweeper();
  server.close(() => {
    process.exit(0);
  });
};

process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);

