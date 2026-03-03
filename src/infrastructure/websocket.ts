import { Server as SocketIOServer } from 'socket.io';
import { createServer, Server as HTTPServer } from 'http';
import { config } from '../config';
import { logger } from './logger';

let io: SocketIOServer | null = null;

export function initializeWebSocket(httpServer?: HTTPServer): SocketIOServer {
  const server = httpServer || createServer();

  io = new SocketIOServer(server, {
    cors: {
      origin: config.get('DASHBOARD_URL') || '*',
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  io.on('connection', (socket) => {
    logger.info('WebSocket client connected', {
      socketId: socket.id,
      totalConnections: io?.engine.clientsCount || 0,
    });

    // Handle feature room subscriptions
    socket.on('subscribe_feature', (featureId: string) => {
      socket.join(`feature:${featureId}`);
      logger.debug('Client subscribed to feature', {
        socketId: socket.id,
        featureId,
      });
    });

    socket.on('unsubscribe_feature', (featureId: string) => {
      socket.leave(`feature:${featureId}`);
      logger.debug('Client unsubscribed from feature', {
        socketId: socket.id,
        featureId,
      });
    });

    // Unit 3: Dashboard room subscriptions
    socket.on('subscribe_dashboard', (userId: string) => {
      socket.join(`dashboard:${userId}`);
      logger.debug('Client subscribed to dashboard', {
        socketId: socket.id,
        userId,
      });
    });

    socket.on('unsubscribe_dashboard', (userId: string) => {
      socket.leave(`dashboard:${userId}`);
      logger.debug('Client unsubscribed from dashboard', {
        socketId: socket.id,
        userId,
      });
    });

    // Unit 3: Report room subscriptions
    socket.on('subscribe_report', (reportId: string) => {
      socket.join(`report:${reportId}`);
      logger.debug('Client subscribed to report', {
        socketId: socket.id,
        reportId,
      });
    });

    socket.on('unsubscribe_report', (reportId: string) => {
      socket.leave(`report:${reportId}`);
      logger.debug('Client unsubscribed from report', {
        socketId: socket.id,
        reportId,
      });
    });

    socket.on('disconnect', (reason) => {
      logger.info('WebSocket client disconnected', {
        socketId: socket.id,
        reason,
      });
    });
  });

  if (!httpServer) {
    const wsPort = config.get('WEBSOCKET_PORT');
    server.listen(wsPort, () => {
      logger.info(`WebSocket server listening on port ${wsPort}`);
    });
  }

  return io;
}

export function getWebSocketServer(): SocketIOServer {
  if (!io) {
    throw new Error('WebSocket server not initialized');
  }
  return io;
}

export function broadcastToFeature(featureId: string, event: string, data: any): void {
  if (!io) {
    logger.warn('WebSocket server not initialized, cannot broadcast');
    return;
  }

  io.to(`feature:${featureId}`).emit(event, data);
  logger.debug('Broadcast to feature', {
    featureId,
    event,
  });
}

export function broadcastGlobal(event: string, data: any): void {
  if (!io) {
    logger.warn('WebSocket server not initialized, cannot broadcast');
    return;
  }

  io.emit(event, data);
  logger.debug('Global broadcast', { event });
}

// Unit 3: Additional broadcast functions
export function broadcastToDashboard(userId: string, event: string, data: any): void {
  if (!io) {
    logger.warn('WebSocket server not initialized, cannot broadcast');
    return;
  }

  io.to(`dashboard:${userId}`).emit(event, data);
  logger.debug('Broadcast to dashboard', {
    userId,
    event,
  });
}

export function broadcastToReport(reportId: string, event: string, data: any): void {
  if (!io) {
    logger.warn('WebSocket server not initialized, cannot broadcast');
    return;
  }

  io.to(`report:${reportId}`).emit(event, data);
  logger.debug('Broadcast to report', {
    reportId,
    event,
  });
}
