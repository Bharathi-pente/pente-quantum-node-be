import { Response } from 'express';
import { AuthRequest } from '../middleware/keycloakAuth.middleware';
import dunningService from '../services/dunning.service';
import { dunningWorkflowService } from '../services/dunning.workflow.service';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';

/**
 * @swagger
 * tags:
 *   name: Dunning
 *   description: Dunning policy management
 */

export class DunningController {
  /**
   * @swagger
   * /dunning/policies:
   *   get:
   *     summary: Get all dunning policies for organization
   *     tags: [Dunning]
   *     responses:
   *       200:
   *         description: List of dunning policies
   */
  getPolicies = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.orgId;
    if (!orgId) {
      return res.status(400).json(ApiResponse.error('Organization ID not found'));
    }

    const policies = await dunningService.getPolicies(orgId);
    return res.status(200).json(ApiResponse.success(policies, 'Dunning policies retrieved successfully'));
  });

  /**
   * @swagger
   * /dunning/policies/{id}:
   *   get:
   *     summary: Get dunning policy by ID
   *     tags: [Dunning]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Dunning policy details
   */
  getPolicyById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const orgId = req.user?.orgId;
    if (!orgId) {
      return res.status(400).json(ApiResponse.error('Organization ID not found'));
    }

    const policy = await dunningService.getPolicyById(id, orgId);
    return res.status(200).json(ApiResponse.success(policy, 'Dunning policy retrieved successfully'));
  });

  /**
   * @swagger
   * /dunning/policies:
   *   post:
   *     summary: Create a new dunning policy
   *     tags: [Dunning]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *             properties:
   *               name:
   *                 type: string
   *               is_default:
   *                 type: boolean
   *               status:
   *                 type: string
   *                 enum: [active, inactive]
   *               retry_schedule:
   *                 type: array
   *     responses:
   *       201:
   *         description: Dunning policy created
   */
  createPolicy = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.orgId;
    if (!orgId) {
      return res.status(400).json(ApiResponse.error('Organization ID not found'));
    }

    const policyData = {
      ...req.body,
      org_id: orgId,
    };

    const policy = await dunningService.createPolicy(policyData);
    return res.status(201).json(ApiResponse.success(policy, 'Dunning policy created successfully'));
  });

  /**
   * @swagger
   * /dunning/policies/{id}:
   *   put:
   *     summary: Update dunning policy
   *     tags: [Dunning]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               is_default:
   *                 type: boolean
   *               status:
   *                 type: string
   *               retry_schedule:
   *                 type: array
   *     responses:
   *       200:
   *         description: Dunning policy updated
   */
  updatePolicy = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const orgId = req.user?.orgId;
    if (!orgId) {
      return res.status(400).json(ApiResponse.error('Organization ID not found'));
    }

    const policy = await dunningService.updatePolicy(id, orgId, req.body);
    return res.status(200).json(ApiResponse.success(policy, 'Dunning policy updated successfully'));
  });

  /**
   * @swagger
   * /dunning/policies/{id}:
   *   delete:
   *     summary: Delete dunning policy
   *     tags: [Dunning]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Dunning policy deleted
   */
  deletePolicy = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const orgId = req.user?.orgId;
    if (!orgId) {
      return res.status(400).json(ApiResponse.error('Organization ID not found'));
    }

    const result = await dunningService.deletePolicy(id);
    return res.status(200).json(ApiResponse.success(result, 'Dunning policy deleted successfully'));
  });

  /**
   * @swagger
   * /dunning/steps:
   *   post:
   *     summary: Create a dunning step
   *     tags: [Dunning]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - policy_id
   *               - day_offset
   *               - action
   *             properties:
   *               policy_id:
   *                 type: string
   *               day_offset:
   *                 type: integer
   *               action:
   *                 type: string
   *               template_name:
   *                 type: string
   *               subject:
   *                 type: string
   *               assignee:
   *                 type: string
   *               escalate_to:
   *                 type: string
   *               grace_period_days:
   *                 type: integer
   *               sort_order:
   *                 type: integer
   *     responses:
   *       201:
   *         description: Dunning step created
   */
  createStep = asyncHandler(async (req: AuthRequest, res: Response) => {
    const step = await dunningService.createStep(req.body);
    return res.status(201).json(ApiResponse.success(step, 'Dunning step created successfully'));
  });

  /**
   * @swagger
   * /dunning/steps/{id}:
   *   put:
   *     summary: Update dunning step
   *     tags: [Dunning]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               day_offset:
   *                 type: integer
   *               action:
   *                 type: string
   *               template_name:
   *                 type: string
   *               subject:
   *                 type: string
   *               assignee:
   *                 type: string
   *               escalate_to:
   *                 type: string
   *               grace_period_days:
   *                 type: integer
   *               sort_order:
   *                 type: integer
   *     responses:
   *       200:
   *         description: Dunning step updated
   */
  updateStep = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { policy_id, ...updateData } = req.body;

    const step = await dunningService.updateStep(id, policy_id, updateData);
    return res.status(200).json(ApiResponse.success(step, 'Dunning step updated successfully'));
  });

  /**
   * @swagger
   * /dunning/steps/{id}:
   *   delete:
   *     summary: Delete dunning step
   *     tags: [Dunning]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - policy_id
   *             properties:
   *               policy_id:
   *                 type: string
   *     responses:
   *       200:
   *         description: Dunning step deleted
   */
  deleteStep = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { policy_id } = req.body;

    const result = await dunningService.deleteStep(id, policy_id);
    return res.status(200).json(ApiResponse.success(result, 'Dunning step deleted successfully'));
  });

  /**
   * @swagger
   * /dunning/overdue-invoices:
   *   get:
   *     summary: Get overdue invoices for dunning
   *     tags: [Dunning]
   *     responses:
   *       200:
   *         description: List of overdue invoices
   */
  getOverdueInvoices = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.orgId;
    if (!orgId) {
      return res.status(400).json(ApiResponse.error('Organization ID not found'));
    }

    const invoices = await dunningService.getOverdueInvoices(orgId);
    return res.status(200).json(ApiResponse.success(invoices, 'Overdue invoices retrieved successfully'));
  });

  /**
   * @swagger
   * /dunning/workflows/start:
   *   post:
   *     summary: Start a dunning workflow for an overdue invoice
   *     tags: [Dunning]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - invoiceId
   *               - policyId
   *               - customerId
   *               - customerEmail
   *               - customerName
   *               - invoiceNumber
   *               - amount
   *               - dueDate
   *             properties:
   *               invoiceId:
   *                 type: string
   *               policyId:
   *                 type: string
   *               customerId:
   *                 type: string
   *               customerEmail:
   *                 type: string
   *               customerName:
   *                 type: string
   *               invoiceNumber:
   *                 type: string
   *               amount:
   *                 type: number
   *               dueDate:
   *                 type: string
   *                 format: date-time
   *     responses:
   *       200:
   *         description: Dunning workflow started
   */
  startDunningWorkflow = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.orgId;
    if (!orgId) {
      return res.status(400).json(ApiResponse.error('Organization ID not found'));
    }

    const workflowData = {
      ...req.body,
      orgId,
    };

    const workflowId = await dunningWorkflowService.startDunningWorkflow(workflowData);
    return res.status(200).json(ApiResponse.success({ workflowId }, 'Dunning workflow started successfully'));
  });

  /**
   * @swagger
   * /dunning/workflows/{workflowId}/status:
   *   get:
   *     summary: Get dunning workflow status
   *     tags: [Dunning]
   *     parameters:
   *       - in: path
   *         name: workflowId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Workflow status
   */
  getWorkflowStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { workflowId } = req.params;

    const status = await dunningWorkflowService.getWorkflowStatus(workflowId);
    return res.status(200).json(ApiResponse.success(status, 'Workflow status retrieved successfully'));
  });

  /**
   * @swagger
   * /dunning/workflows/{workflowId}/signal:
   *   post:
   *     summary: Send a signal to a dunning workflow
   *     tags: [Dunning]
   *     parameters:
   *       - in: path
   *         name: workflowId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - signalName
   *             properties:
   *               signalName:
   *                 type: string
   *                 enum: [pause, resume, cancel, paymentReceived]
   *               signalData:
   *                 type: object
   *     responses:
   *       200:
   *         description: Signal sent successfully
   */
  sendWorkflowSignal = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { workflowId } = req.params;
    const { signalName, signalData } = req.body;

    await dunningWorkflowService.sendWorkflowSignal(workflowId, signalName, signalData);
    return res.status(200).json(ApiResponse.success(null, 'Signal sent successfully'));
  });

  /**
   * @swagger
   * /dunning/workflows/{workflowId}/query:
   *   get:
   *     summary: Query dunning workflow for current status
   *     tags: [Dunning]
   *     parameters:
   *       - in: path
   *         name: workflowId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Workflow query result
   */
  queryWorkflowStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { workflowId } = req.params;

    const status = await dunningWorkflowService.queryWorkflowStatus(workflowId);
    return res.status(200).json(ApiResponse.success(status, 'Workflow status queried successfully'));
  });
}

export default new DunningController();