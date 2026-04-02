import { Router } from 'express';
import productController from '../controllers/product.controller';
import rateLimitController from '../controllers/rateLimit.controller';
import { validate } from '../middleware/validation.middleware';
import authMiddleware from '../middleware/keycloakAuth.middleware';
import enrichUserMiddleware from '../middleware/enrichUser.middleware';
import {
  createProductSchema,
  updateProductSchema,
  getProductSchema,
} from '../validators/product.validator';
import { getByProductSchema } from '../validators/rateLimit.validator';

const router = Router();

// Apply authentication and user enrichment middleware
router.use(authMiddleware);
router.use(enrichUserMiddleware);

/**
 * @route   POST /api/v1/products
 * @desc    Create product
 * @access  Private
 */
router.post('/', validate(createProductSchema), productController.create);

// Keycloak authentication removed — routes are unprotected by Keycloak

/**
 * @route   GET /api/v1/products
 * @desc    Get all products
 * @access  Private
 */
router.get('/', productController.getAll);

/**
 * @route   GET /api/v1/products/:id
 * @desc    Get product by ID
 * @access  Private
 */
router.get('/:id', validate(getProductSchema), productController.getById);

/**
 * @route   PUT /api/v1/products/:id
 * @desc    Update product
 * @access  Private (admin)
 */
router.put('/:id', validate(updateProductSchema), productController.update);

/**
 * @route   DELETE /api/v1/products/:id
 * @desc    Delete product
 * @access  Private (admin)
 */
router.delete('/:id', validate(getProductSchema), productController.delete);

/**
 * @route   POST /api/v1/products/:id/features/:featureId
 * @desc    Add feature to product
 * @access  Private (admin)
 */
router.post('/:id/features/:featureId', productController.addFeature);
/**
 * @route   DELETE /api/v1/products/:id/features/:featureId
 * @desc    Remove feature from product
 * @access  Private (admin)
 */
router.delete('/:id/features/:featureId', productController.removeFeature);

/**
 * @route   GET /api/v1/products/:productId/rate-limit-policies
 * @desc    Get all rate limit policies for a product
 * @access  Private
 */
router.get('/:productId/rate-limit-policies', validate(getByProductSchema), rateLimitController.getByProduct);

export default router;
