import { Router } from 'express';
import { CreditController } from '../controllers/credit.controller';
import { authenticateKeycloak } from '../middleware/keycloakAuth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createCreditSchema,
  updateCreditSchema,
  getCreditsSchema,
  getCreditByIdSchema,
  deleteCreditSchema,
  getCreditLedgerSchema
} from '../validators/credit.validator';

const router = Router();

// All credit routes require authentication
router.use(authenticateKeycloak);

/**
 * @swagger
 * /api/credits:
 *   post:
 *     tags: [Credits]
 *     summary: Create a new credit
 *   get:
 *     tags: [Credits]
 *     summary: Get all credits
 */
router
  .route('/')
  .post(validate(createCreditSchema), CreditController.createCredit)
  .get(validate(getCreditsSchema), CreditController.getCredits);

/**
 * @swagger
 * /api/credits/{id}:
 *   get:
 *     tags: [Credits]
 *     summary: Get credit by ID
 *   put:
 *     tags: [Credits]
 *     summary: Update credit
 *   delete:
 *     tags: [Credits]
 *     summary: Delete credit
 */
router
  .route('/:id')
  .get(validate(getCreditByIdSchema), CreditController.getCreditById)
  .put(validate(updateCreditSchema), CreditController.updateCredit)
  .delete(validate(deleteCreditSchema), CreditController.deleteCredit);

/**
 * @swagger
 * /api/credits/{id}/apply:
 *   post:
 *     tags: [Credits]
 *     summary: Apply credit to invoice/payment
 */
router.post('/:id/apply', CreditController.applyCredit);

/**
 * @swagger
 * /api/credits/{creditId}/ledger:
 *   get:
 *     tags: [Credits]
 *     summary: Get credit ledger entries
 */
router.get('/:creditId/ledger', validate(getCreditLedgerSchema), CreditController.getCreditLedger);

/**
 * @swagger
 * /api/customers/{customerId}/credits/summary:
 *   get:
 *     tags: [Credits]
 *     summary: Get customer credit summary
 */
router.get('/customers/:customerId/summary', CreditController.getCustomerCreditSummary);

export default router;