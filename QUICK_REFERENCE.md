# QuantumBilling Backend - Quick Reference

## ⚡ Quick Start Commands

### First Time Setup
```bash
npm run setup      # Automated setup (installs deps, generates Prisma, builds)
# OR manually:
npm install
npm run prisma:introspect
npm run prisma:generate
npm run build
```

### Development
```bash
npm run dev                 # Start development server (hot reload)
npm run db:check           # Check database tables
npm run prisma:studio      # Open database GUI
```

### Production
```bash
npm run build              # Compile TypeScript
npm start                  # Start production server
```

### Database
```bash
npm run prisma:introspect  # Pull schema from database
npm run prisma:generate    # Generate Prisma Client
npm run prisma:push        # Push schema changes to database
npm run prisma:studio      # Open Prisma Studio GUI
npm run db:check           # Quick database connection check
```

### Code Quality
```bash
npm run lint               # Check code style
npm run lint:fix           # Auto-fix linting issues
npm test                   # Run tests
```

---

## 🌐 Server URLs

| Service | URL | Description |
|---------|-----|-------------|
| **API Server** | http://localhost:3000 | Main API endpoint |
| **API Docs** | http://localhost:3000/api-docs | Swagger UI |
| **Health Check** | http://localhost:3000/api/v1/health | API status |
| **Prisma Studio** | http://localhost:5555 | Database GUI |

---

## 📋 API Endpoints Quick Reference

### 🔓 Public Endpoints (No Auth Required)

```bash
POST /api/v1/auth/login        # Login
POST /api/v1/auth/register     # Register
POST /api/v1/auth/validate     # Validate token
GET  /api/v1/health            # Health check
```

### 🔒 Protected Endpoints (Auth Required)

#### Organizations
```bash
GET    /api/v1/organizations           # List all
POST   /api/v1/organizations           # Create
GET    /api/v1/organizations/:id       # Get one
PUT    /api/v1/organizations/:id       # Update
DELETE /api/v1/organizations/:id       # Delete
```

#### Users
```bash
GET    /api/v1/users                   # List all
POST   /api/v1/users                   # Create
GET    /api/v1/users/:id               # Get one
PUT    /api/v1/users/:id               # Update
DELETE /api/v1/users/:id               # Delete
GET    /api/v1/auth/me                 # Get current user
```

#### Customers
```bash
GET    /api/v1/customers               # List all (paginated)
POST   /api/v1/customers               # Create
GET    /api/v1/customers/:id           # Get one
PUT    /api/v1/customers/:id           # Update
DELETE /api/v1/customers/:id           # Delete
GET    /api/v1/customers/stats         # Get statistics
```

#### Products
```bash
GET    /api/v1/products                           # List all
POST   /api/v1/products                           # Create
GET    /api/v1/products/:id                       # Get one
PUT    /api/v1/products/:id                       # Update
DELETE /api/v1/products/:id                       # Delete
POST   /api/v1/products/:id/features/:featureId   # Add feature
DELETE /api/v1/products/:id/features/:featureId   # Remove feature
```

---

## 🔐 Authentication

### Get JWT Token
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

### Use Token in Requests
```bash
curl -X GET http://localhost:3000/api/v1/customers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

---

## 📊 Common Query Parameters

### Pagination
```bash
?page=1&limit=10           # Page 1, 10 items per page
```

### Filtering
```bash
?status=active             # Filter by status
?search=keyword            # Search in name/email
?product_id=uuid           # Filter by product
```

### Example
```bash
GET /api/v1/customers?page=1&limit=20&status=active&search=acme
```

---

## 🗂️ Project Structure

```
backend/
├── src/
│   ├── config/            # Database, Logger, Swagger
│   ├── middleware/        # Auth, Validation, Error handling
│   ├── utils/             # ApiError, ApiResponse, asyncHandler
│   ├── validators/        # Zod schemas
│   ├── services/          # Business logic
│   ├── controllers/       # Request handlers
│   ├── routes/            # API routes
│   ├── types/             # TypeScript types
│   ├── app.ts             # Express app
│   └── server.ts          # Entry point
├── prisma/
│   └── schema.prisma      # Database schema
├── logs/                  # Log files
└── dist/                  # Compiled output
```

---

## 🛠️ Environment Variables

```env
DATABASE_URL=postgres://...                     # Required
JWT_SECRET=your-secret                          # Required
PORT=3000                                       # Optional
NODE_ENV=development                            # Optional
CORS_ORIGIN=*                                   # Optional
LOG_LEVEL=info                                  # Optional
```

---

## 🐛 Troubleshooting

### Can't connect to database
```bash
npm run db:check           # Test connection
# Check DATABASE_URL in .env
```

### TypeScript errors
```bash
rm -rf dist node_modules
npm install
npm run build
```

### Prisma errors
```bash
npx prisma generate --force
npm run prisma:introspect
```

### Port already in use
```bash
# Change PORT in .env or kill existing process
lsof -i :3000              # macOS/Linux
netstat -ano | findstr :3000   # Windows
```

---

## 📦 Database Schema (49 Tables)

### Core (5)
organizations, users, roles, role_permissions, features

### Customers (6)
customers, contracts, entitlement_grants, usage_limits, limit_overrides, tax_exemptions

### Products (7)
products, product_features, meters, pricing_models, pricing_tiers, rate_cards, rate_card_rates

### Billing (7)
invoices, invoice_line_items, payments, payment_methods, credit_notes, credits, credit_ledger

### Infrastructure (7)
api_keys, webhooks, webhook_logs, integrations, reports, rate_limit_policies, rate_limit_rules

### Alerts (4)
alerts, alert_channels, alert_channel_map, alert_history

### AI/Analytics (4)
anomalies, recommendations, pricing_tests, pricing_test_variants

### Compliance (6)
audit_logs, data_retention_policies, gdpr_requests, compliance_reports, discrepancies, migrations

### Tax & Dunning (3)
tax_regions, dunning_policies, dunning_steps

---

## 📚 Documentation Files

- **README.md** - Main documentation
- **SETUP_GUIDE.md** - Detailed setup instructions
- **PROJECT_OVERVIEW.md** - Complete project overview
- **QUICK_REFERENCE.md** - This file
- **.env.example** - Environment variable template

---

## 💡 Pro Tips

1. **Use Prisma Studio** for visual database browsing
   ```bash
   npm run prisma:studio
   ```

2. **Test APIs in Swagger UI** instead of Postman
   ```
   http://localhost:3000/api-docs
   ```

3. **Check logs for debugging**
   ```bash
   tail -f logs/all.log
   tail -f logs/error.log
   ```

4. **Auto-format on save** in VS Code
   ```json
   {
     "editor.formatOnSave": true,
     "editor.defaultFormatter": "esbenp.prettier-vscode"
   }
   ```

5. **Use nodemon in dev** for instant reload
   ```bash
   npm run dev    # Auto-restarts on file changes
   ```

---

## 🚀 What's Next?

### Immediate
1. Run `npm run setup` to initialize
2. Start server with `npm run dev`
3. Test endpoints at http://localhost:3000/api-docs
4. Explore database with `npm run prisma:studio`

### Short Term
- Add remaining modules (Invoices, Payments, Meters, etc.)
- Write unit tests
- Add integration tests
- Set up CI/CD

### Long Term
- Deploy to production (AWS/GCP/Azure/Heroku)
- Add monitoring (Sentry, New Relic)
- Set up analytics
- Add caching (Redis)
- Implement webhooks
- Add real-time features (Socket.io)

---

## 🆘 Need Help?

1. **Setup Issues**: Check SETUP_GUIDE.md
2. **API Questions**: Check http://localhost:3000/api-docs
3. **Database Issues**: Run `npm run db:check`
4. **Code Examples**: Check controllers and services
5. **Architecture**: Check PROJECT_OVERVIEW.md

---

**Happy Coding! 🎉**
