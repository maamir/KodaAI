import { Request, Response, NextFunction } from 'express';
import { timeTrackingService } from '../services/time-tracking.service';
import { featureRepository } from '../repositories/feature.repository';
import { NotFoundError } from '../infrastructure/errors';

export class FeaturesController {
  async startTracking(req: Request, res: Response, next: NextFunction) {
    try {
      const { featureId, name, estimatedHours } = req.body;
      const feature = await timeTrackingService.startFeatureTracking(
        featureId,
        name,
        estimatedHours
      );
      res.status(201).json(feature);
    } catch (error) {
      next(error);
    }
  }

  async getFeature(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const feature = await featureRepository.findById(id);
      
      if (!feature) {
        throw new NotFoundError('Feature not found');
      }

      res.json(feature);
    } catch (error) {
      next(error);
    }
  }

  async listFeatures(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 20, status, phase } = req.query;
      
      const skip = (Number(page) - 1) * Number(pageSize);
      const take = Number(pageSize);

      const where: any = {};
      if (status) where.status = status;
      if (phase) where.currentPhase = phase;

      const [features, total] = await Promise.all([
        featureRepository.findAll({ skip, take, where }),
        featureRepository.count(where),
      ]);

      res.json({
        data: features,
        pagination: {
          page: Number(page),
          pageSize: Number(pageSize),
          total,
          totalPages: Math.ceil(total / Number(pageSize)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async transitionPhase(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { phase } = req.body;
      const feature = await timeTrackingService.transitionPhase(id, phase);
      res.json(feature);
    } catch (error) {
      next(error);
    }
  }

  async pauseTracking(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const tracking = await timeTrackingService.pauseTracking(id);
      res.json(tracking);
    } catch (error) {
      next(error);
    }
  }

  async resumeTracking(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const tracking = await timeTrackingService.resumeTracking(id);
      res.json(tracking);
    } catch (error) {
      next(error);
    }
  }

  async completeFeature(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const feature = await timeTrackingService.completeFeature(id);
      const summary = await timeTrackingService.calculateFeatureSummary(id);
      res.json({ feature, summary });
    } catch (error) {
      next(error);
    }
  }
}

export const featuresController = new FeaturesController();
