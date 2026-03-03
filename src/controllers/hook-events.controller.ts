import { Request, Response, NextFunction } from 'express';
import { hookEventService } from '../services/hook-event.service';
import { dataAggregationService } from '../services/data-aggregation.service';
import { broadcastToFeature } from '../infrastructure/websocket';

export class HookEventsController {
  async createHookEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { featureId, eventType, eventData, timestamp } = req.body;

      let hookEvent;

      switch (eventType) {
        case 'FILE_EDIT':
          hookEvent = await hookEventService.processFileEditEvent(
            featureId,
            eventData,
            new Date(timestamp)
          );
          break;
        case 'PROMPT_SUBMITTED':
          hookEvent = await hookEventService.processPromptEvent(
            featureId,
            eventData,
            new Date(timestamp)
          );
          break;
        case 'AGENT_EXECUTION':
          hookEvent = await hookEventService.processAgentExecutionEvent(
            featureId,
            eventData,
            new Date(timestamp)
          );
          break;
        default:
          return res.status(400).json({
            code: 'INVALID_EVENT_TYPE',
            message: 'Invalid event type',
          });
      }

      // Broadcast real-time update
      broadcastToFeature(featureId, 'hook_event', {
        eventType,
        timestamp: hookEvent.timestamp,
      });

      res.status(201).json(hookEvent);
    } catch (error) {
      next(error);
    }
  }

  async getFeatureHookEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const { featureId } = req.params;
      const events = await hookEventService.getFeatureHookEvents(featureId);
      const aggregation = await dataAggregationService.aggregateHookData(featureId);

      res.json({
        events,
        aggregation,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUnprocessedEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const events = await hookEventService.getUnprocessedEvents();
      res.json({ events });
    } catch (error) {
      next(error);
    }
  }
}

export const hookEventsController = new HookEventsController();
