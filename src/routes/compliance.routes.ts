import { Router } from 'express';
import { AuthRequest } from '../types/auth';
import { complianceService } from '../services/compliance.service';

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

    const result = await complianceService.getReports(req.user!.orgId, {
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
  } catch (error) {
    console.error('Error fetching compliance reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve compliance reports'
    });
  }
});

/**
 * @route   GET /api/compliance-reports/stats
 * @desc    Get compliance statistics
 * @access  Private
 */
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const stats = await complianceService.getStats(req.user!.orgId);

    res.json({
      success: true,
      data: stats,
      message: 'Compliance statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching compliance stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve compliance statistics'
    });
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

    const report = await complianceService.generateReport(
      req.user!.orgId,
      framework,
      new Date(period_start),
      new Date(period_end),
      req.user!.id
    );

    return res.status(201).json({
      success: true,
      data: report,
      message: 'Compliance report generation started'
    });
  } catch (error) {
    console.error('Error generating compliance report:', error);
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
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { status, findings, download_url } = req.body;

    const report = await complianceService.updateReport(
      req.params.id,
      { status, findings, downloadUrl: download_url },
      req.user!.id
    );

    res.json({
      success: true,
      data: report,
      message: 'Compliance report updated successfully'
    });
  } catch (error) {
    console.error('Error updating compliance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update compliance report'
    });
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
    console.error('Error downloading compliance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download compliance report'
    });
  }
});

export default router;