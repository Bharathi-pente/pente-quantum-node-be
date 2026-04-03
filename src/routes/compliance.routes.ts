import { Router } from 'express';
import { AuthRequest } from '../types/auth';
import { complianceService } from '../services/compliance.service';
import logger from '../config/logger';

const router = Router();

// Keycloak auth removed — routes are now unprotected by Keycloak

/**
 * @route   GET /api/compliance-reports
 * @desc    Get compliance reports
 * @access  Private
 */
router.get('/', async (req: AuthRequest, res) => {
  try {
    const {
      cursor,
      limit = '20',
      sort_field = 'id',
      sort_order = 'desc',
      framework,
      status,
      date_from,
      date_to,
    } = req.query;

    const orgId = req.query.orgId as string || req.headers['x-org-id'] as string;
    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: 'orgId query parameter or x-org-id header is required'
      });
    }

    const result = await complianceService.getReports(orgId, {
      cursor: cursor as string,
      limit: parseInt(limit as string),
      sortField: sort_field as string,
      sortOrder: sort_order as 'asc' | 'desc',
      framework: framework as string,
      status: status as string,
      dateFrom: date_from ? new Date(date_from as string) : undefined,
      dateTo: date_to ? new Date(date_to as string) : undefined,
    });

    res.json({
      success: true,
      data: result.data,
      pageInfo: result.pageInfo,
      message: 'Compliance reports retrieved successfully'
    });
    return;
  } catch (error) {
    logger.error('Error fetching compliance reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve compliance reports'
    });
    return;
  }
});

/**
 * @route   GET /api/compliance-reports/stats
 * @desc    Get compliance statistics
 * @access  Private
 */
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const orgId = req.query.orgId as string || req.headers['x-org-id'] as string;
    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: 'orgId query parameter or x-org-id header is required'
      });
    }

    const stats = await complianceService.getStats(orgId);

    res.json({
      success: true,
      data: stats,
      message: 'Compliance statistics retrieved successfully'
    });
    return;
  } catch (error) {
    logger.error('Error fetching compliance stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve compliance statistics'
    });
    return;
  }
});

/**
 * @route   POST /api/compliance-reports
 * @desc    Generate compliance report
 * @access  Private (admin only)
 */
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { framework, period_start, period_end } = req.body;

    if (!framework || !period_start || !period_end) {
      return res.status(400).json({
        success: false,
        message: 'Framework, period_start, and period_end are required'
      });
    }

    const orgId = req.body.org_id || req.headers['x-org-id'] as string;
    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: 'org_id in body or x-org-id header is required'
      });
    }

    const userId = req.body.user_id || req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'user_id in body or x-user-id header is required'
      });
    }

    const report = await complianceService.generateReport(
      orgId,
      framework,
      new Date(period_start),
      new Date(period_end),
      userId
    );

    return res.status(201).json({
      success: true,
      data: report,
      message: 'Compliance report generation started'
    });
  } catch (error) {
    logger.error('Error generating compliance report:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate compliance report'
    });
  }
});

/**
 * @route   PUT /api/compliance-reports/:id
 * @desc    Update compliance report
 * @access  Private (admin only)
 */
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { status, findings, download_url } = req.body;

    const userId = req.body.user_id || req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'user_id in body or x-user-id header is required'
      });
    }

    const report = await complianceService.updateReport(
      req.params.id,
      { status, findings, downloadUrl: download_url },
      userId
    );

    res.json({
      success: true,
      data: report,
      message: 'Compliance report updated successfully'
    });
    return;
  } catch (error) {
    logger.error('Error updating compliance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update compliance report'
    });
    return;
  }
});

/**
 * @route   GET /api/compliance-reports/:id/download
 * @desc    Download compliance report
 * @access  Private
 */
router.get('/:id/download', async (req: AuthRequest, res) => {
  try {
    // In a real implementation, this would serve the actual file
    // For now, we'll return a placeholder response
    res.json({
      success: true,
      message: 'Report download functionality would be implemented here',
      report_id: req.params.id
    });
  } catch (error) {
    logger.error('Error downloading compliance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download compliance report'
    });
  }
});

export default router;