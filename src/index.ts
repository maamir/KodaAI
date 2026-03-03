import { app } from './app';
import { config } from './config';
import { logger } from './infrastructure/logger';
import { prisma } from './infrastructure/database';
import { initializeWebSocket } from './infrastructure/websocket';
import { createServer } from 'http';

const PORT = config.get('API_PORT');

let server: any;
let wsServer: any;

async function start() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected');

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize WebSocket server
    wsServer = initializeWebSocket(httpServer);
    logger.info('WebSocket server initialized');

    // Start server
    server = httpServer.listen(PORT, () => {
      logger.info(`API server listening on port ${PORT}`);
      logger.info(`Environment: ${config.get('NODE_ENV')}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received, starting graceful shutdown`);

  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
    });
  }

  if (wsServer) {
    wsServer.close(() => {
      logger.info('WebSocket server closed');
    });
  }

  await prisma.$disconnect();
  logger.info('Database connections closed');

  process.exit(0);
}

start();
