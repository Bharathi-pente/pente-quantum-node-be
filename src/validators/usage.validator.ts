import { z } from 'zod';

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateUsageEvent:
 *       type: object
 *       required:
 *         - meter_id
 *         - event_type
 *         - event_value
 *       properties:
 *         customer_id:
 *           type: string
 *           format: uuid
 *           description: Customer ID (optional, will be inferred from context if not provided)
 *         meter_id:
 *           type: string
 *           format: uuid
 *           description: Meter ID
 *         event_type:
 *           type: string
 *           maxLength: 100
 *           description: Type of usage event
 *         event_value:
 *           type: number
 *           description: Numeric value of the usage event
 *         event_time:
 *           type: string
 *           format: date-time
 *           description: Timestamp of the event (defaults to now)
 *         metadata:
 *           type: object
 *           description: Additional metadata for the event
 *         source:
 *           type: string
 *           maxLength: 100
 *           description: Source system that generated the event
 *     UsageEventResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         org_id:
 *           type: string
 *           format: uuid
 *         customer_id:
 *           type: string
 *           format: uuid
 *         meter_id:
 *           type: string
 *           format: uuid
 *         event_type:
 *           type: string
 *         event_value:
 *           type: number
 *         event_time:
 *           type: string
 *           format: date-time
 *         metadata:
 *           type: object
 *         source:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *     UsageAggregationQuery:
 *       type: object
 *       properties:
 *         customer_id:
 *           type: string
 *           format: uuid
 *           description: Filter by customer ID
 *         meter_id:
 *           type: string
 *           format: uuid
 *           description: Filter by meter ID
 *         event_type:
 *           type: string
 *           description: Filter by event type
 *         start_date:
 *           type: string
 *           format: date-time
 *           description: Start date for aggregation
 *         end_date:
 *           type: string
 *           format: date-time
 *           description: End date for aggregation
 *         granularity:
 *           type: string
 *           enum: [hour, day, week, month]
 *           default: day
 *           description: Time granularity for aggregation
 *         group_by:
 *           type: array
 *           items:
 *             type: string
 *             enum: [customer_id, meter_id, event_type, day, week, month]
 *           description: Fields to group by
 */

export const createUsageEventSchema = z.object({
  body: z.object({
    customer_id: z.string().uuid().optional(),
    meter_id: z.string().uuid(),
    event_type: z.string().max(100),
    event_value: z.number().positive(),
    event_time: z.string().datetime().optional(),
    metadata: z.record(z.any()).optional(),
    source: z.string().max(100).optional(),
  }),
});

export const getUsageEventsSchema = z.object({
  query: z.object({
    customer_id: z.string().uuid().optional(),
    meter_id: z.string().uuid().optional(),
    event_type: z.string().optional(),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
    limit: z.string().transform(val => parseInt(val)).refine(val => val > 0 && val <= 1000, {
      message: 'Limit must be between 1 and 1000',
    }).optional().default('100'),
    offset: z.string().transform(val => parseInt(val)).refine(val => val >= 0, {
      message: 'Offset must be non-negative',
    }).optional().default('0'),
  }),
});

export const getUsageEventSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const getUsageAggregationSchema = z.object({
  query: z.object({
    customer_id: z.string().uuid().optional(),
    meter_id: z.string().uuid().optional(),
    event_type: z.string().optional(),
    start_date: z.string().datetime(),
    end_date: z.string().datetime(),
    granularity: z.enum(['hour', 'day', 'week', 'month']).default('day'),
    group_by: z.string().optional().default('day').transform(val => val.split(',')).refine(
      val => val.every(field => ['customer_id', 'meter_id', 'event_type', 'day', 'week', 'month'].includes(field)),
      { message: 'Invalid group_by field' }
    ),
    aggregation: z.enum(['sum', 'avg', 'min', 'max', 'count']).default('sum'),
  }),
});

export const getUsageStatsSchema = z.object({
  query: z.object({
    customer_id: z.string().uuid().optional(),
    meter_id: z.string().uuid().optional(),
    event_type: z.string().optional(),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
    period: z.enum(['hour', 'day', 'week', 'month', 'year']).default('month'),
  }),
});

export const bulkCreateUsageEventsSchema = z.object({
  body: z.object({
    events: z.array(z.object({
      customer_id: z.string().uuid().optional(),
      meter_id: z.string().uuid(),
      event_type: z.string().max(100),
      event_value: z.number().positive(),
      event_time: z.string().datetime().optional(),
      metadata: z.record(z.any()).optional(),
      source: z.string().max(100).optional(),
    })).min(1).max(1000),
  }),
});