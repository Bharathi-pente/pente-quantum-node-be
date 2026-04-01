import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import invoiceService from '../services/invoice.service';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';

/**
 * @swagger
 * tags:
 *   name: Invoices
 *   description: Invoice management for billing
 */

export class InvoiceController {
  /**
   * @swagger
   * /invoices:
   *   post:
   *     summary: Create a new invoice
   *     tags: [Invoices]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - invoice_number
   *               - customer_id
   *               - issue_date
   *               - due_date
   *               - subtotal
   *             properties:
   *               invoice_number:
   *                 type: string
   *                 description: Unique invoice number
   *               customer_id:
   *                 type: string
   *                 format: uuid
   *                 description: Customer ID
   *               issue_date:
   *                 type: string
   *                 format: date
   *                 description: Issue date (YYYY-MM-DD)
   *               due_date:
   *                 type: string
   *                 format: date
   *                 description: Due date (YYYY-MM-DD)
   *               subtotal:
   *                 type: number
   *                 description: Subtotal amount
   *               credits_applied:
   *                 type: number
   *                 description: Credits applied (optional)
   *               tax_amount:
   *                 type: number
   *                 description: Tax amount (optional)
   *               tax_rate:
   *                 type: number
   *                 description: Tax rate percentage (optional)
   *               currency:
   *                 type: string
   *                 description: Currency code (default USD)
   *               payment_method_id:
   *                 type: string
   *                 format: uuid
   *                 description: Payment method ID (optional)
   *               notes:
   *                 type: string
   *                 description: Invoice notes (optional)
   *               status:
   *                 type: string
   *                 enum: [draft, pending, paid, overdue, void]
   *                 description: Invoice status (optional)
   *     responses:
   *       201:
   *         description: Invoice created successfully
   */
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.body.org_id || req.headers['x-org-id'] as string;
    if (!orgId) {
      res.status(400).json(ApiResponse.error('org_id is required'));
      return;
    }
    const invoice = await invoiceService.create(req.body, orgId, req);
    res.status(201).json(ApiResponse.success(invoice, 'Invoice created successfully'));
  });

  /**
   * @swagger
   * /invoices:
   *   get:
   *     summary: Get all invoices
   *     tags: [Invoices]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Items per page
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [draft, pending, paid, overdue, void]
   *         description: Filter by status
   *       - in: query
   *         name: customer_id
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter by customer ID
   *       - in: query
   *         name: invoice_number
   *         schema:
   *           type: string
   *         description: Search by invoice number
   *       - in: query
   *         name: date_from
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter from issue date (YYYY-MM-DD)
   *       - in: query
   *         name: date_to
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter to issue date (YYYY-MM-DD)
   *     responses:
   *       200:
   *         description: List of invoices
   */
  getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const orgId = req.query.orgId as string || req.headers['x-org-id'] as string;
    if (!orgId) {
      res.status(400).json(ApiResponse.error('orgId query parameter or x-org-id header is required'));
      return;
    }
    const filters = {
      status: req.query.status as string,
      customer_id: req.query.customer_id as string || req.headers['x-customer-id'] as string,
      invoice_number: req.query.invoice_number as string,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
    };

    const result = await invoiceService.findAll(orgId, page, limit, filters);
    res.json(ApiResponse.success(result, 'Invoices retrieved successfully'));
  });

  /**
   * @swagger
   * /invoices/{id}:
   *   get:
   *     summary: Get invoice by ID
   *     tags: [Invoices]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Invoice ID
   *     responses:
   *       200:
   *         description: Invoice details
   */
  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.query.orgId as string || req.headers['x-org-id'] as string;
    if (!orgId) {
      res.status(400).json(ApiResponse.error('orgId query parameter or x-org-id header is required'));
      return;
    }
    const invoice = await invoiceService.findById(req.params.id, orgId);
    res.json(ApiResponse.success(invoice, 'Invoice retrieved successfully'));
  });

  /**
   * @swagger
   * /invoices/{id}:
   *   put:
   *     summary: Update invoice
   *     tags: [Invoices]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Invoice ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               invoice_number:
   *                 type: string
   *                 description: Unique invoice number
   *               status:
   *                 type: string
   *                 enum: [draft, pending, paid, overdue, void]
   *                 description: Invoice status
   *               due_date:
   *                 type: string
   *                 format: date
   *                 description: Due date (YYYY-MM-DD)
   *               paid_date:
   *                 type: string
   *                 format: date
   *                 description: Paid date (YYYY-MM-DD)
   *               credits_applied:
   *                 type: number
   *                 description: Credits applied
   *               tax_amount:
   *                 type: number
   *                 description: Tax amount
   *               tax_rate:
   *                 type: number
   *                 description: Tax rate percentage
   *               payment_method_id:
   *                 type: string
   *                 format: uuid
   *                 description: Payment method ID
   *               notes:
   *                 type: string
   *                 description: Invoice notes
   *     responses:
   *       200:
   *         description: Invoice updated successfully
   */
  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.body.org_id || req.headers['x-org-id'] as string;
    if (!orgId) {
      res.status(400).json(ApiResponse.error('org_id in body or x-org-id header is required'));
      return;
    }
    const invoice = await invoiceService.update(req.params.id, req.body, orgId);
    res.json(ApiResponse.success(invoice, 'Invoice updated successfully'));
  });

  /**
   * @swagger
   * /invoices/{id}:
   *   delete:
   *     summary: Delete invoice
   *     tags: [Invoices]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Invoice ID
   *     responses:
   *       200:
   *         description: Invoice deleted successfully
   */
  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.query.orgId as string || req.headers['x-org-id'] as string;
    if (!orgId) {
      res.status(400).json(ApiResponse.error('orgId query parameter or x-org-id header is required'));
      return;
    }
    await invoiceService.delete(req.params.id, orgId);
    res.json(ApiResponse.success(null, 'Invoice deleted successfully'));
  });

  /**
   * @swagger
   * /organizations/{id}/invoices:
   *   get:
   *     summary: Get all invoices for an organization
   *     tags: [Invoices]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Organization ID
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Items per page
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [draft, pending, paid, overdue, void]
   *         description: Filter by status
   *       - in: query
   *         name: customer_id
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter by customer ID
   *       - in: query
   *         name: invoice_number
   *         schema:
   *           type: string
   *         description: Search by invoice number
   *       - in: query
   *         name: date_from
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter from issue date (YYYY-MM-DD)
   *       - in: query
   *         name: date_to
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter to issue date (YYYY-MM-DD)
   *     responses:
   *       200:
   *         description: List of invoices for the organization
   */
  getByOrganization = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const filters = {
      status: req.query.status as string,
      customer_id: req.query.customer_id as string,
      invoice_number: req.query.invoice_number as string,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
    };

    const result = await invoiceService.findAll(req.params.id, page, limit, filters);
    res.json(ApiResponse.success(result, 'Organization invoices retrieved successfully'));
  });

  /**
   * @swagger
   * /customers/{id}/invoices:
   *   get:
   *     summary: Get all invoices for a customer
   *     tags: [Invoices]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Customer ID
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Items per page
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [draft, pending, paid, overdue, void]
   *         description: Filter by status
   *       - in: query
   *         name: invoice_number
   *         schema:
   *           type: string
   *         description: Search by invoice number
   *       - in: query
   *         name: date_from
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter from issue date (YYYY-MM-DD)
   *       - in: query
   *         name: date_to
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter to issue date (YYYY-MM-DD)
   *     responses:
   *       200:
   *         description: List of invoices for the customer
   */
  getByCustomer = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const orgId = req.query.orgId as string || req.headers['x-org-id'] as string;
    if (!orgId) {
      res.status(400).json(ApiResponse.error('orgId query parameter or x-org-id header is required'));
      return;
    }
    const filters = {
      status: req.query.status as string,
      invoice_number: req.query.invoice_number as string,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
    };

    const result = await invoiceService.findByCustomer(req.params.id, orgId, page, limit, filters);
    res.json(ApiResponse.success(result, 'Customer invoices retrieved successfully'));
  });
}

export default new InvoiceController();