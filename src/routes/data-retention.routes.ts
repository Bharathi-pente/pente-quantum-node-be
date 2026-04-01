import { Router } from 'express';
import { AuthRequest } from '../types/auth';
import { dataRetentionService } from '../services/data-retention.service';
// Keycloak authentication removed — routes are unprotected by Keycloak

const router = Router();

// All data retention routes previously required Keycloak; now unauthenticated

/**
 * @route   GET /api/data-retention-policies
 * @desc    Get data retention policies
 * @access  Private
 */
router.get('/', async (req: AuthRequest, res) => {
  try {
    const {
      cursor,
      limit = '20',
      sort_field = 'id',
      sort_order = 'desc',
      category,
      status,
      auto_delete,
    } = req.query;

    const orgId = req.query.orgId as string || req.headers['x-org-id'] as string;
    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: 'orgId query parameter or x-org-id header is required'
      });
    }

    const result = await dataRetentionService.getPolicies(orgId, {
      cursor: cursor as string,
      limit: parseInt(limit as string),
      sortField: sort_field as string,
      sortOrder: sort_order as 'asc' | 'desc',
      category: category as string,
      status: status as string,
      autoDelete: auto_delete === 'true' ? true : auto_delete === 'false' ? false : undefined,
    });

    res.json({
      success: true,
      data: result.data,
      pageInfo: result.pageInfo,
      message: 'Data retention policies retrieved successfully'
    });
    return;
  } catch (error) {
    console.error('Error fetching data retention policies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve data retention policies'
    });
    return;
  }
});

/**
 * @route   GET /api/data-retention-policies/stats
 * @desc    Get data retention statistics
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

    const stats = await dataRetentionService.getStats(orgId);

    res.json({
      success: true,
      data: stats,
      message: 'Data retention statistics retrieved successfully'
    });
    return;
  } catch (error) {
    console.error('Error fetching data retention stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve data retention statistics'
    });
    return;
  }
});

/**
 * @route   POST /api/data-retention-policies
 * @desc    Create data retention policy
 * @access  Private (admin only)
 */
router.post('/', async (req: AuthRequest, res) => {
  try {
    const {
      name,
      description,
      retentionPeriod,
      retentionUnit,
      category,
      autoDelete,
      reviewFrequencyMonths,
    } = req.body;

    if (!name || !retentionPeriod || !retentionUnit || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, retentionPeriod, retentionUnit, and category are required'
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

    const policy = await dataRetentionService.createPolicy(
      orgId,
      {
        name,
        description,
        retentionPeriod,
        retentionUnit,
        category,
        autoDelete: autoDelete || false,
        reviewFrequencyMonths,
      },
      userId
    );

    return res.status(201).json({
      success: true,
      data: policy,
      message: 'Data retention policy created successfully'
    });
  } catch (error) {
    console.error('Error creating data retention policy:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create data retention policy'
    });
  }
});

/**
 * @route   PUT /api/data-retention-policies/:id
 * @desc    Update data retention policy
 * @access  Private (admin only)
 */
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const {
      name,
      description,
      retentionPeriod,
      retentionUnit,
      autoDelete,
      status,
    } = req.body;

    const policy = await dataRetentionService.updatePolicy(
      req.params.id,
      {
        name,
        description,
        retentionPeriod,
        retentionUnit,
        autoDelete,
        status,
      },
      req.user!.id
    );

    res.json({
      success: true,
      data: policy,
      message: 'Data retention policy updated successfully'
    });
  } catch (error) {
    console.error('Error updating data retention policy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update data retention policy'
    });
  }
});

/**
 * @route   POST /api/data-retention-policies/:id/review
 * @desc    Review data retention policy
 * @access  Private (admin only)
 */
router.post('/:id/review', async (req: AuthRequest, res) => {
  try {
    const policy = await dataRetentionService.reviewPolicy(
      req.params.id,
      req.user!.id
    );

    return res.json({
      success: true,
      data: policy,
      message: 'Data retention policy reviewed successfully'
    });
  } catch (error) {
    console.error('Error reviewing data retention policy:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to review data retention policy'
    });
  }
});

/**
 * @route   POST /api/data-retention-policies/cleanup
 * @desc    Execute data cleanup
 * @access  Private (admin only)
 */
router.post('/cleanup', async (req: AuthRequest, res) => {
  try {
    const { dryRun = true } = req.body;

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

    const result = await dataRetentionService.executeDataCleanup(
      orgId,
      userId,
      dryRun
    );

    return res.json({
      success: true,
      data: result,
      message: dryRun ? 'Data cleanup simulation completed' : 'Data cleanup executed successfully'
    });
  } catch (error) {
    console.error('Error executing data cleanup:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to execute data cleanup'
    });
  }
});

export default router;