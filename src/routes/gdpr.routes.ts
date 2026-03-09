import { Router } from 'express';
import { authenticateKeycloak, requireRole } from '../middleware/keycloakAuth.middleware';
import { AuthRequest } from '../middleware/keycloakAuth.middleware';
import { gdprService } from '../services/gdpr.service';

const router = Router();

// All GDPR routes require authentication
router.use(authenticateKeycloak);

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
    console.error('Error fetching GDPR requests:', error);
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
    console.error('Error fetching GDPR stats:', error);
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

    const request = await gdprService.createRequest(
      customerId,
      {
        requestType,
        dataCategories,
        notes,
      },
      req.user!.id,
      req.user!.orgId
    );

    return res.status(201).json({
      success: true,
      data: request,
      message: 'GDPR request submitted successfully'
    });
  } catch (error) {
    console.error('Error creating GDPR request:', error);
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
router.put('/:id', requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { status, notes } = req.body;

    const request = await gdprService.updateRequest(
      req.params.id,
      { status, notes },
      req.user!.id
    );

    res.json({
      success: true,
      data: request,
      message: 'GDPR request updated successfully'
    });
  } catch (error) {
    console.error('Error updating GDPR request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update GDPR request'
    });
  }
});

/**
 * @route   POST /api/gdpr-requests/:id/process
 * @desc    Process GDPR request
 * @access  Private (admin only)
 */
router.post('/:id/process', requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const result = await gdprService.processRequest(req.params.id, req.user!.id);

    res.json({
      success: true,
      data: result,
      message: 'GDPR request processed successfully'
    });
  } catch (error) {
    console.error('Error processing GDPR request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process GDPR request'
    });
  }
});

/**
 * @route   GET /api/gdpr-requests/overdue
 * @desc    Get overdue GDPR requests
 * @access  Private (admin only)
 */
router.get('/overdue', requireRole('admin'), async (_req: AuthRequest, res) => {
  try {
    const requests = await gdprService.getOverdueRequests();

    res.json({
      success: true,
      data: requests,
      message: 'Overdue GDPR requests retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching overdue GDPR requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve overdue GDPR requests'
    });
  }
});

export default router;