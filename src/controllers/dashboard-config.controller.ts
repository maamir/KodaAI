import { Request, Response, NextFunction } from 'express';
import { dashboardConfigurationService } from '../services/dashboard-configuration.service';
import { createDashboardViewSchema, updateDashboardViewSchema, dashboardViewQuerySchema } from '../types/schemas';
import { NotFoundError } from '../infrastructure/errors';
import { logger } from '../infrastructure/logger';

export class DashboardConfigController {
  /**
   * POST /api/dashboard-config/views
   * Create a new dashboard view
   */
  async createDashboardView(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'anonymous';
      const validation = createDashboardViewSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.error.errors,
        });
      }

      // Validate configuration
      const configValidation = dashboardConfigurationService.validateDashboardConfig({
        ...validation.data,
        userId,
      });

      if (!configValidation.valid) {
        return res.status(400).json({
          error: 'Invalid dashboard configuration',
          details: configValidation.errors,
        });
      }

      const view = await dashboardConfigurationService.createDashboardView({
        ...validation.data,
        userId,
      });

      res.status(201).json(view);
    } catch (error) {
      logger.error('Error creating dashboard view:', error);
      next(error);
    }
  }

  /**
   * GET /api/dashboard-config/views
   * Get all dashboard views for the user
   */
  async getDashboardViews(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'anonymous';
      const validation = dashboardViewQuerySchema.safeParse(req.query);

      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.error.errors,
        });
      }

      const { viewType, isDefault } = validation.data;

      let views;
      if (viewType) {
        views = await dashboardConfigurationService.getDashboardViewsByType(userId, viewType);
      } else {
        views = await dashboardConfigurationService.getUserDashboardViews(userId);
      }

      // Filter by isDefault if specified
      if (isDefault !== undefined) {
        views = views.filter(v => v.isDefault === isDefault);
      }

      res.json({
        data: views,
        count: views.length,
      });
    } catch (error) {
      logger.error('Error getting dashboard views:', error);
      next(error);
    }
  }

  /**
   * GET /api/dashboard-config/views/:id
   * Get a specific dashboard view
   */
  async getDashboardView(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const view = await dashboardConfigurationService.getDashboardView(id);

      res.json(view);
    } catch (error) {
      logger.error('Error getting dashboard view:', error);
      next(error);
    }
  }

  /**
   * GET /api/dashboard-config/views/default
   * Get the default dashboard view for the user
   */
  async getDefaultDashboardView(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'anonymous';

      const view = await dashboardConfigurationService.getDefaultDashboardView(userId);

      res.json(view);
    } catch (error) {
      logger.error('Error getting default dashboard view:', error);
      next(error);
    }
  }

  /**
   * PUT /api/dashboard-config/views/:id
   * Update a dashboard view
   */
  async updateDashboardView(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 'anonymous';
      const validation = updateDashboardViewSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.error.errors,
        });
      }

      const view = await dashboardConfigurationService.updateDashboardView(
        id,
        userId,
        validation.data
      );

      res.json(view);
    } catch (error) {
      logger.error('Error updating dashboard view:', error);
      next(error);
    }
  }

  /**
   * DELETE /api/dashboard-config/views/:id
   * Delete a dashboard view
   */
  async deleteDashboardView(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 'anonymous';

      await dashboardConfigurationService.deleteDashboardView(id, userId);

      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting dashboard view:', error);
      next(error);
    }
  }

  /**
   * POST /api/dashboard-config/views/:id/set-default
   * Set a dashboard view as default
   */
  async setAsDefault(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 'anonymous';

      const view = await dashboardConfigurationService.setAsDefault(id, userId);

      res.json(view);
    } catch (error) {
      logger.error('Error setting dashboard view as default:', error);
      next(error);
    }
  }

  /**
   * POST /api/dashboard-config/views/:id/clone
   * Clone a dashboard view
   */
  async cloneDashboardView(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 'anonymous';
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({
          error: 'Name is required for cloned view',
        });
      }

      const view = await dashboardConfigurationService.cloneDashboardView(id, userId, name);

      res.status(201).json(view);
    } catch (error) {
      logger.error('Error cloning dashboard view:', error);
      next(error);
    }
  }

  /**
   * GET /api/dashboard-config/widget-types
   * Get available widget types
   */
  async getAvailableWidgetTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const widgetTypes = dashboardConfigurationService.getAvailableWidgetTypes();

      res.json({
        data: widgetTypes,
        count: widgetTypes.length,
      });
    } catch (error) {
      logger.error('Error getting widget types:', error);
      next(error);
    }
  }
}

export const dashboardConfigController = new DashboardConfigController();
