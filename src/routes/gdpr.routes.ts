import { Router } from 'express';
import { AuthRequest } from '../types/auth';
import { gdprService } from '../services/gdpr.service';
import logger from '../config/logger';

const router = Router();

// Keycloak authentication removed — routes are unprotected by Keycloak

/**
 * @route   GET /api/gdpr-requests
 * @desc    Get GDPR requests
 * @access  Private
 */
router.get('/', async (req: AuthRequest, res) => {
  try {
    const {
      cursor,
      limit = '20',
      sort_field = 'requested_at',
      sort_order = 'desc',
      request_type,
      status,
      customer_email,
      date_from,
      date_to,
    } = req.query;

    const result = await gdprService.getRequests({
      cursor: cursor as string,
      limit: parseInt(limit as string),
      sortField: sort_field as string,
      sortOrder: sort_order as 'asc' | 'desc',
      requestType: request_type as string,
      status: status as string,
      customerEmail: customer_email as string,
      dateFrom: date_from ? new Date(date_from as string) : undefined,
      dateTo: date_to ? new Date(date_to as string) : undefined,
    });

    res.json({
      success: true,
      data: result.data,
      pageInfo: result.pageInfo,
      message: 'GDPR requests retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching GDPR requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve GDPR requests'
    });
  }
});

/**
 * @route   GET /api/gdpr-requests/stats
 * @desc    Get GDPR statistics
 * @access  Private
 */
router.get('/stats', async (_req: AuthRequest, res) => {
  try {
    const stats = await gdprService.getStats();

    res.json({
      success: true,
      data: stats,
      message: 'GDPR statistics retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching GDPR stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve GDPR statistics'
    });
  }
});

/**
 * @route   POST /api/gdpr-requests
 * @desc    Create GDPR request
 * @access  Private
 */
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { customerId, requestType, dataCategories, notes } = req.body;

    if (!customerId || !requestType || !dataCategories) {
      return res.status(400).json({
        success: false,
        message: 'customerId, requestType, and dataCategories are required'
      });
    }

    const userId = req.body.user_id || req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'user_id in body or x-user-id header is required'
      });
    }

    const orgId = req.body.org_id || req.headers['x-org-id'] as string;
    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: 'org_id in body or x-org-id header is required'
      });
    }

    const request = await gdprService.createRequest(
      customerId,
      {
        requestType,
        dataCategories,
        notes,
      },
      userId,
      orgId
    );

    return res.status(201).json({
      success: true,
      data: request,
      message: 'GDPR request submitted successfully'
    });
  } catch (error) {
    logger.error('Error creating GDPR request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create GDPR request'
    });
  }
});

/**
 * @route   PUT /api/gdpr-requests/:id
 * @desc    Update GDPR request status
 * @access  Private (admin only)
 */
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { status, notes } = req.body;

    const userId = req.body.user_id || req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'user_id in body or x-user-id header is required'
      });
    }

    const request = await gdprService.updateRequest(
      req.params.id,
      { status, notes },
      userId
    );

    res.json({
      success: true,
      data: request,
      message: 'GDPR request updated successfully'
    });
    return;
  } catch (error) {
    logger.error('Error fetching GDPR requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update GDPR request'
    });
    return;
  }
});

/**
 * @route   POST /api/gdpr-requests/:id/process
 * @desc    Process GDPR request
 * @access  Private (admin only)
 */
router.post('/:id/process', async (req: AuthRequest, res) => {
  try {
    const userId = req.body.user_id || req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'user_id in body or x-user-id header is required'
      });
    }

    const result = await gdprService.processRequest(req.params.id, userId);

    res.json({
      success: true,
      data: result,
      message: 'GDPR request processed successfully'
    });
    return;
  } catch (error) {
    logger.error('Error processing GDPR request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process GDPR request'
    });
    return;
  }
});

/**
 * @route   GET /api/gdpr-requests/overdue
 * @desc    Get overdue GDPR requests
 * @access  Private (admin only)
 */
router.get('/overdue', async (_req: AuthRequest, res) => {
  try {
    const requests = await gdprService.getOverdueRequests();

    res.json({
      success: true,
      data: requests,
      message: 'Overdue GDPR requests retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching overdue GDPR requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve overdue GDPR requests'
    });
  }
});

export default router;