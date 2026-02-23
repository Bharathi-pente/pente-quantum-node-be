import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'QuantumBilling API',
      version: '1.0.0',
      description: 'Comprehensive billing and metering platform API',
      contact: {
        name: 'API Support',
        email: 'support@quantumbilling.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}/api/v1`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        CreateInvoice: {
          type: 'object',
          required: ['invoice_number', 'customer_id', 'issue_date', 'due_date', 'subtotal'],
          properties: {
            invoice_number: {
              type: 'string',
              description: 'Unique invoice number',
            },
            customer_id: {
              type: 'string',
              format: 'uuid',
              description: 'Customer ID',
            },
            issue_date: {
              type: 'string',
              format: 'date',
              description: 'Issue date (YYYY-MM-DD)',
            },
            due_date: {
              type: 'string',
              format: 'date',
              description: 'Due date (YYYY-MM-DD)',
            },
            subtotal: {
              type: 'number',
              description: 'Subtotal amount',
            },
            credits_applied: {
              type: 'number',
              description: 'Credits applied (optional)',
            },
            tax_amount: {
              type: 'number',
              description: 'Tax amount (optional)',
            },
            tax_rate: {
              type: 'number',
              description: 'Tax rate percentage (optional)',
            },
            currency: {
              type: 'string',
              description: 'Currency code (default USD)',
            },
            payment_method_id: {
              type: 'string',
              format: 'uuid',
              description: 'Payment method ID (optional)',
            },
            notes: {
              type: 'string',
              description: 'Invoice notes (optional)',
            },
            status: {
              type: 'string',
              enum: ['draft', 'pending', 'paid', 'overdue', 'void'],
              description: 'Invoice status (optional)',
            },
          },
        },
        InvoiceResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
            data: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid',
                },
                invoice_number: {
                  type: 'string',
                },
                customer_id: {
                  type: 'string',
                  format: 'uuid',
                },
                status: {
                  type: 'string',
                  enum: ['draft', 'pending', 'paid', 'overdue', 'void'],
                },
                issue_date: {
                  type: 'string',
                  format: 'date-time',
                },
                due_date: {
                  type: 'string',
                  format: 'date-time',
                },
                paid_date: {
                  type: 'string',
                  format: 'date-time',
                  nullable: true,
                },
                subtotal: {
                  type: 'number',
                },
                credits_applied: {
                  type: 'number',
                },
                tax_amount: {
                  type: 'number',
                },
                tax_rate: {
                  type: 'number',
                },
                total: {
                  type: 'number',
                },
                currency: {
                  type: 'string',
                },
                payment_method_id: {
                  type: 'string',
                  format: 'uuid',
                  nullable: true,
                },
                notes: {
                  type: 'string',
                  nullable: true,
                },
                dunning_step: {
                  type: 'integer',
                },
                created_at: {
                  type: 'string',
                  format: 'date-time',
                },
              },
            },
            message: {
              type: 'string',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
