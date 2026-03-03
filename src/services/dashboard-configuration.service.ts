import { ViewType } from '@prisma/client';
import { dashboardViewRepository } from '../repositories/dashboard-view.repository';
import { logger } from '../infrastructure/logger';

export interface CreateDashboardViewParams {
  userId: string;
  name: string;
  description?: string;
  viewType: ViewType;
  layout: Record<string, any>;
  widgets: Array<{
    widgetId: string;
    widgetType: string;
    position: { x: number; y: number; w: number; h: number };
    config: Record<string, any>;
  }>;
  filters?: Record<string, any>;
  isDefault?: boolean;
}

export interface UpdateDashboardViewParams {
  name?: string;
  description?: string;
  layout?: Record<string, any>;
  widgets?: Array<{
    widgetId: string;
    widgetType: string;
    position: { x: number; y: number; w: number; h: number };
    config: Record<string, any>;
  }>;
  filters?: Record<string, any>;
  isDefault?: boolean;
}

export class DashboardConfigurationService {
  /**
   * Create a new dashboard view
   */
  async createDashboardView(params: CreateDashboardViewParams) {
    try {
      // Validate widget count
      const maxWidgets = 12; // From config
      if (params.widgets.length > maxWidgets) {
        throw new Error(`Dashboard cannot have more than ${maxWidgets} widgets`);
      }

      // If setting as default, unset other defaults first
      if (params.isDefault) {
        await dashboardViewRepository.unsetDefault(params.userId);
      }

      const view = await dashboardViewRepository.create({
        userId: params.userId,
        name: params.name,
        description: params.description,
        viewType: params.viewType,
        layout: params.layout,
        widgets: params.widgets,
        filters: params.filters || {},
        isDefault: params.isDefault || false,
      });

      logger.info(`Dashboard view created: ${view.id} for user ${params.userId}`);
      return view;
    } catch (error) {
      logger.error('Error creating dashboard view:', error);
      throw error;
    }
  }

  /**
   * Get dashboard view by ID
   */
  async getDashboardView(viewId: string) {
    try {
      const view = await dashboardViewRepository.findById(viewId);
      if (!view) {
        throw new Error('Dashboard view not found');
      }
      return view;
    } catch (error) {
      logger.error(`Error getting dashboard view ${viewId}:`, error);
      throw error;
    }
  }

  /**
   * Get all dashboard views for a user
   */
  async getUserDashboardViews(userId: string) {
    try {
      return await dashboardViewRepository.findByUserId(userId);
    } catch (error) {
      logger.error(`Error getting dashboard views for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get default dashboard view for a user
   */
  async getDefaultDashboardView(userId: string) {
    try {
      let view = await dashboardViewRepository.findDefaultByUserId(userId);

      // If no default view exists, create one
      if (!view) {
        view = await this.createDefaultDashboardView(userId);
      }

      return view;
    } catch (error) {
      logger.error(`Error getting default dashboard view for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update dashboard view
   */
  async updateDashboardView(viewId: string, userId: string, params: UpdateDashboardViewParams) {
    try {
      const view = await dashboardViewRepository.findById(viewId);
      if (!view) {
        throw new Error('Dashboard view not found');
      }

      if (view.userId !== userId) {
        throw new Error('Unauthorized to update this dashboard view');
      }

      // Validate widget count if updating widgets
      if (params.widgets) {
        const maxWidgets = 12;
        if (params.widgets.length > maxWidgets) {
          throw new Error(`Dashboard cannot have more than ${maxWidgets} widgets`);
        }
      }

      // If setting as default, unset other defaults first
      if (params.isDefault) {
        await dashboardViewRepository.unsetDefault(userId);
      }

      const updated = await dashboardViewRepository.update(viewId, params);
      logger.info(`Dashboard view updated: ${viewId}`);
      return updated;
    } catch (error) {
      logger.error(`Error updating dashboard view ${viewId}:`, error);
      throw error;
    }
  }

  /**
   * Delete dashboard view
   */
  async deleteDashboardView(viewId: string, userId: string) {
    try {
      const view = await dashboardViewRepository.findById(viewId);
      if (!view) {
        throw new Error('Dashboard view not found');
      }

      if (view.userId !== userId) {
        throw new Error('Unauthorized to delete this dashboard view');
      }

      await dashboardViewRepository.delete(viewId);
      logger.info(`Dashboard view deleted: ${viewId}`);
    } catch (error) {
      logger.error(`Error deleting dashboard view ${viewId}:`, error);
      throw error;
    }
  }

  /**
   * Set dashboard view as default
   */
  async setAsDefault(viewId: string, userId: string) {
    try {
      const view = await dashboardViewRepository.findById(viewId);
      if (!view) {
        throw new Error('Dashboard view not found');
      }

      if (view.userId !== userId) {
        throw new Error('Unauthorized to modify this dashboard view');
      }

      const updated = await dashboardViewRepository.setAsDefault(viewId, userId);
      logger.info(`Dashboard view set as default: ${viewId}`);
      return updated;
    } catch (error) {
      logger.error(`Error setting dashboard view as default ${viewId}:`, error);
      throw error;
    }
  }

  /**
   * Clone dashboard view
   */
  async cloneDashboardView(viewId: string, userId: string, newName: string) {
    try {
      const cloned = await dashboardViewRepository.cloneView(viewId, userId, newName);
      logger.info(`Dashboard view cloned: ${viewId} -> ${cloned.id}`);
      return cloned;
    } catch (error) {
      logger.error(`Error cloning dashboard view ${viewId}:`, error);
      throw error;
    }
  }

  /**
   * Get dashboard views by type
   */
  async getDashboardViewsByType(userId: string, viewType: ViewType) {
    try {
      return await dashboardViewRepository.findByUserIdAndType(userId, viewType);
    } catch (error) {
      logger.error(`Error getting dashboard views by type for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Create default dashboard view for a user
   */
  private async createDefaultDashboardView(userId: string) {
    const defaultLayout = {
      columns: 12,
      rowHeight: 100,
      breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480 },
    };

    const defaultWidgets = [
      {
        widgetId: 'summary-stats',
        widgetType: 'SUMMARY_STATS',
        position: { x: 0, y: 0, w: 12, h: 2 },
        config: {},
      },
      {
        widgetId: 'time-saved-chart',
        widgetType: 'TIME_SAVED_CHART',
        position: { x: 0, y: 2, w: 6, h: 3 },
        config: { chartType: 'bar' },
      },
      {
        widgetId: 'speed-multiplier-chart',
        widgetType: 'SPEED_MULTIPLIER_CHART',
        position: { x: 6, y: 2, w: 6, h: 3 },
        config: { chartType: 'gauge' },
      },
      {
        widgetId: 'feature-list',
        widgetType: 'FEATURE_LIST',
        position: { x: 0, y: 5, w: 12, h: 4 },
        config: { limit: 10 },
      },
    ];

    return this.createDashboardView({
      userId,
      name: 'Default Dashboard',
      description: 'Auto-generated default dashboard',
      viewType: ViewType.DEVELOPER,
      layout: defaultLayout,
      widgets: defaultWidgets,
      filters: {},
      isDefault: true,
    });
  }

  /**
   * Get available widget types
   */
  getAvailableWidgetTypes(): Array<{ type: string; name: string; description: string }> {
    return [
      {
        type: 'SUMMARY_STATS',
        name: 'Summary Statistics',
        description: 'Overview of key metrics and statistics',
      },
      {
        type: 'TIME_SAVED_CHART',
        name: 'Time Saved Chart',
        description: 'Visualization of time saved across features',
      },
      {
        type: 'SPEED_MULTIPLIER_CHART',
        name: 'Speed Multiplier Chart',
        description: 'Gauge showing average speed multiplier',
      },
      {
        type: 'COST_SAVINGS_CHART',
        name: 'Cost Savings Chart',
        description: 'Bar chart of cost savings over time',
      },
      {
        type: 'QUALITY_METRICS_CHART',
        name: 'Quality Metrics Chart',
        description: 'Quality score and defect rate visualization',
      },
      {
        type: 'TREND_CHART',
        name: 'Trend Chart',
        description: 'Time series trends of key metrics',
      },
      {
        type: 'FEATURE_LIST',
        name: 'Feature List',
        description: 'Table of recent features with key metrics',
      },
    ];
  }

  /**
   * Validate dashboard configuration
   */
  validateDashboardConfig(config: CreateDashboardViewParams): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.name || config.name.trim().length === 0) {
      errors.push('Dashboard name is required');
    }

    if (config.name && config.name.length > 100) {
      errors.push('Dashboard name must be 100 characters or less');
    }

    if (!config.layout || typeof config.layout !== 'object') {
      errors.push('Dashboard layout is required');
    }

    if (!config.widgets || !Array.isArray(config.widgets)) {
      errors.push('Dashboard widgets must be an array');
    }

    if (config.widgets && config.widgets.length === 0) {
      errors.push('Dashboard must have at least one widget');
    }

    if (config.widgets && config.widgets.length > 12) {
      errors.push('Dashboard cannot have more than 12 widgets');
    }

    // Validate widget positions
    if (config.widgets) {
      config.widgets.forEach((widget, index) => {
        if (!widget.widgetId) {
          errors.push(`Widget ${index + 1}: widgetId is required`);
        }
        if (!widget.widgetType) {
          errors.push(`Widget ${index + 1}: widgetType is required`);
        }
        if (!widget.position || typeof widget.position !== 'object') {
          errors.push(`Widget ${index + 1}: position is required`);
        } else {
          if (typeof widget.position.x !== 'number' || widget.position.x < 0) {
            errors.push(`Widget ${index + 1}: position.x must be a non-negative number`);
          }
          if (typeof widget.position.y !== 'number' || widget.position.y < 0) {
            errors.push(`Widget ${index + 1}: position.y must be a non-negative number`);
          }
          if (typeof widget.position.w !== 'number' || widget.position.w < 1) {
            errors.push(`Widget ${index + 1}: position.w must be at least 1`);
          }
          if (typeof widget.position.h !== 'number' || widget.position.h < 1) {
            errors.push(`Widget ${index + 1}: position.h must be at least 1`);
          }
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const dashboardConfigurationService = new DashboardConfigurationService();
