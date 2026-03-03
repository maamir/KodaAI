import { getWebSocketServer, broadcastToFeature, broadcastGlobal } from '../infrastructure/websocket';
import { logger } from '../infrastructure/logger';

export interface DashboardUpdatePayload {
  featureId?: string;
  updateType: 'metric' | 'feature' | 'report' | 'dashboard';
  data: any;
  timestamp: Date;
}

export interface MetricUpdatePayload {
  featureId: string;
  metricType: string;
  metricValue: number;
  calculatedAt: Date;
}

export interface ReportUpdatePayload {
  reportId: string;
  status: string;
  progress?: number;
  fileUrl?: string;
  error?: string;
}

export class RealTimeUpdateService {
  private subscriptions: Map<string, Set<string>> = new Map(); // userId -> Set<featureId>

  /**
   * Subscribe a user to dashboard updates
   */
  subscribeUser(userId: string, featureIds?: string[]): void {
    if (!this.subscriptions.has(userId)) {
      this.subscriptions.set(userId, new Set());
    }

    if (featureIds) {
      const userSubs = this.subscriptions.get(userId)!;
      featureIds.forEach(id => userSubs.add(id));
      logger.debug(`User ${userId} subscribed to ${featureIds.length} features`);
    }
  }

  /**
   * Unsubscribe a user from specific features or all
   */
  unsubscribeUser(userId: string, featureIds?: string[]): void {
    if (!this.subscriptions.has(userId)) {
      return;
    }

    if (featureIds) {
      const userSubs = this.subscriptions.get(userId)!;
      featureIds.forEach(id => userSubs.delete(id));
      logger.debug(`User ${userId} unsubscribed from ${featureIds.length} features`);
    } else {
      this.subscriptions.delete(userId);
      logger.debug(`User ${userId} unsubscribed from all features`);
    }
  }

  /**
   * Get all features a user is subscribed to
   */
  getUserSubscriptions(userId: string): string[] {
    const subs = this.subscriptions.get(userId);
    return subs ? Array.from(subs) : [];
  }

  /**
   * Broadcast metric update to subscribers
   */
  broadcastMetricUpdate(payload: MetricUpdatePayload): void {
    try {
      const event = 'metrics:updated';
      const data = {
        featureId: payload.featureId,
        metricType: payload.metricType,
        metricValue: payload.metricValue,
        calculatedAt: payload.calculatedAt,
        timestamp: new Date(),
      };

      // Broadcast to feature-specific room
      broadcastToFeature(payload.featureId, event, data);

      // Also broadcast to global dashboard room
      broadcastGlobal('dashboard:metric_updated', data);

      logger.debug('Metric update broadcasted', {
        featureId: payload.featureId,
        metricType: payload.metricType,
      });
    } catch (error) {
      logger.error('Error broadcasting metric update:', error);
    }
  }

  /**
   * Broadcast multiple metric updates at once
   */
  broadcastMetricBatch(updates: MetricUpdatePayload[]): void {
    try {
      const event = 'metrics:batch_updated';
      const data = {
        updates: updates.map(u => ({
          featureId: u.featureId,
          metricType: u.metricType,
          metricValue: u.metricValue,
          calculatedAt: u.calculatedAt,
        })),
        timestamp: new Date(),
      };

      // Broadcast to all affected features
      const featureIds = [...new Set(updates.map(u => u.featureId))];
      featureIds.forEach(featureId => {
        const featureUpdates = updates.filter(u => u.featureId === featureId);
        broadcastToFeature(featureId, event, {
          updates: featureUpdates,
          timestamp: new Date(),
        });
      });

      // Global broadcast
      broadcastGlobal('dashboard:metrics_batch_updated', data);

      logger.debug(`Metric batch update broadcasted (${updates.length} updates)`);
    } catch (error) {
      logger.error('Error broadcasting metric batch:', error);
    }
  }

  /**
   * Broadcast feature status update
   */
  broadcastFeatureUpdate(featureId: string, status: string, data?: any): void {
    try {
      const event = 'feature:updated';
      const payload = {
        featureId,
        status,
        data,
        timestamp: new Date(),
      };

      broadcastToFeature(featureId, event, payload);
      broadcastGlobal('dashboard:feature_updated', payload);

      logger.debug('Feature update broadcasted', { featureId, status });
    } catch (error) {
      logger.error('Error broadcasting feature update:', error);
    }
  }

  /**
   * Broadcast report generation status update
   */
  broadcastReportUpdate(payload: ReportUpdatePayload): void {
    try {
      const event = 'report:status_updated';
      const data = {
        reportId: payload.reportId,
        status: payload.status,
        progress: payload.progress,
        fileUrl: payload.fileUrl,
        error: payload.error,
        timestamp: new Date(),
      };

      broadcastGlobal(event, data);

      logger.debug('Report update broadcasted', {
        reportId: payload.reportId,
        status: payload.status,
      });
    } catch (error) {
      logger.error('Error broadcasting report update:', error);
    }
  }

  /**
   * Broadcast dashboard data refresh notification
   */
  broadcastDashboardRefresh(userId?: string, reason?: string): void {
    try {
      const event = 'dashboard:refresh';
      const data = {
        reason: reason || 'data_updated',
        timestamp: new Date(),
      };

      if (userId) {
        // Broadcast to specific user (would need user-specific rooms)
        broadcastGlobal(event, { ...data, userId });
      } else {
        // Broadcast to all
        broadcastGlobal(event, data);
      }

      logger.debug('Dashboard refresh broadcasted', { userId, reason });
    } catch (error) {
      logger.error('Error broadcasting dashboard refresh:', error);
    }
  }

  /**
   * Broadcast real-time activity update (for active features)
   */
  broadcastActivityUpdate(featureId: string, activity: any): void {
    try {
      const event = 'activity:updated';
      const data = {
        featureId,
        activity,
        timestamp: new Date(),
      };

      broadcastToFeature(featureId, event, data);
      broadcastGlobal('dashboard:activity_updated', data);

      logger.debug('Activity update broadcasted', { featureId });
    } catch (error) {
      logger.error('Error broadcasting activity update:', error);
    }
  }

  /**
   * Send notification to specific user or all users
   */
  sendNotification(message: string, type: 'info' | 'success' | 'warning' | 'error', userId?: string): void {
    try {
      const event = 'notification';
      const data = {
        message,
        type,
        timestamp: new Date(),
      };

      if (userId) {
        // Would need user-specific room implementation
        broadcastGlobal(event, { ...data, userId });
      } else {
        broadcastGlobal(event, data);
      }

      logger.debug('Notification sent', { type, userId });
    } catch (error) {
      logger.error('Error sending notification:', error);
    }
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): { totalConnections: number; activeRooms: number } {
    try {
      const io = getWebSocketServer();
      const sockets = io.sockets.sockets;
      const rooms = io.sockets.adapter.rooms;

      return {
        totalConnections: sockets.size,
        activeRooms: rooms.size,
      };
    } catch (error) {
      logger.error('Error getting connection stats:', error);
      return { totalConnections: 0, activeRooms: 0 };
    }
  }

  /**
   * Check if WebSocket server is available
   */
  isAvailable(): boolean {
    try {
      getWebSocketServer();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Broadcast custom event
   */
  broadcastCustomEvent(event: string, data: any, featureId?: string): void {
    try {
      const payload = {
        ...data,
        timestamp: new Date(),
      };

      if (featureId) {
        broadcastToFeature(featureId, event, payload);
      } else {
        broadcastGlobal(event, payload);
      }

      logger.debug('Custom event broadcasted', { event, featureId });
    } catch (error) {
      logger.error('Error broadcasting custom event:', error);
    }
  }

  /**
   * Cleanup subscriptions for inactive users
   */
  cleanupInactiveSubscriptions(): void {
    // This would typically be called periodically
    // For now, just log the count
    logger.debug(`Active subscriptions: ${this.subscriptions.size} users`);
  }
}

export const realTimeUpdateService = new RealTimeUpdateService();
