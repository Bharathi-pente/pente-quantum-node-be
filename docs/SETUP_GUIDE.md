# QuantumBilling Backend - Quick Setup Guide

## 🎯 Quick Start (5 minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Database Connection
The `.env` file is already configured with your PostgreSQL connection. Verify it's correct:
```env
DATABASE_URL="your_postgres_connection_string_here"
```

### Step 3: Generate Prisma Schema from Your Database
Since your tables are already created (49 tables detected), run:
```bash
npm run prisma:introspect
```

This will read your PostgreSQL database and generate the Prisma schema automatically.

### Step 4: Generate Prisma Client
```bash
npm run prisma:generate
```

### Step 5: Start Development Server
```bash
npm run dev
```

The server will start at: **http://localhost:3000**

---

## 📝 Verify Installation

### 1. Check API Health
Open browser: http://localhost:3000/api/v1/health

Expected response:
```json
{
  "success": true,
  "message": "QuantumBilling API is running",
  "timestamp": "2026-02-19T...",
  "environment": "development"
}
```

### 2. Access API Documentation
Open browser: http://localhost:3000/api-docs

You'll see the Swagger UI with all available endpoints.

### 3. Test Database Connection
```bash
npm run prisma:studio
```

This opens Prisma Studio - a visual database browser at http://localhost:5555

---

## 🔐 Authentication Flow

### 1. Login to get JWT token
```bash
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "name": "User Name",
      "email": "user@example.com",
      "orgId": "org-uuid",
      "organization": "Company Name",
      "role": "Admin",
      "permissions": ["users.create", "customers.read", ...]
    }
  }
}
```

### 2. Use token in subsequent requests
```bash
GET http://localhost:3000/api/v1/customers
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🧪 Test the APIs

### Example: Create a Customer
```bash
POST http://localhost:3000/api/v1/customers
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "name": "Acme Corporation",
  "email": "contact@acme.com",
  "product_id": "product-uuid",
  "status": "active",
  "mrr": 9900,
  "health_score": 85
}
```

### Example: List Customers with Pagination
```bash
GET http://localhost:3000/api/v1/customers?page=1&limit=10&status=active
Authorization: Bearer <your-token>
```

### Example: Get Customer Statistics
```bash
GET http://localhost:3000/api/v1/customers/stats
Authorization: Bearer <your-token>
```

Response:
```json
{
  "success": true,
  "data": {
    "totalCustomers": 245,
    "activeCustomers": 198,
    "trialCustomers": 32,
    "totalMRR": 485000
  }
}
```

---

## 📊 Database Structure

Your PostgreSQL database has **49 tables**:

### Core Entities:
- `organizations` - Multi-tenant organizations
- `users` - User accounts with roles
- `roles` & `role_permissions` - RBAC system
- `customers` - Billing customers
- `products` - Product catalog
- `features` - Product features

### Billing & Invoicing:
- `contracts` - Customer contracts
- `invoices` & `invoice_line_items` - Invoicing
- `payments` & `payment_methods` - Payment processing
- `credit_notes` - Credit management
- `credits` & `credit_ledger` - Credit tracking

### Metering & Pricing:
- `meters` - Usage meters
- `pricing_models` & `pricing_tiers` - Pricing logic
- `rate_cards` & `rate_card_rates` - Rate management
- `usage_limits` & `limit_overrides` - Usage controls

### Advanced Features:
- `alerts` & `alert_channels` - Alert system
- `webhooks` & `webhook_logs` - Webhook management
- `api_keys` - API key management
- `audit_logs` - Activity tracking
- `anomalies` & `recommendations` - AI features

---

## 🛠️ Troubleshooting

### Issue: Cannot connect to database
**Solution:** Check your DATABASE_URL in `.env` file and ensure:
- Database server is accessible
- Credentials are correct
- SSL mode is properly configured

### Issue: Prisma introspection fails
**Solution:** 
```bash
# Clear Prisma cache
npx prisma generate --force

# Re-run introspection
npm run prisma:introspect
```

### Issue: TypeScript compilation errors
**Solution:**
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Issue: Port already in use
**Solution:** Change PORT in `.env` file:
```env
PORT=3001
```

---

## 📚 Next Steps

1. **Add More Modules**: Extend the system with:
   - Invoicing module
   - Payment processing
   - Metering/usage tracking
   - Webhooks management
   - Analytics/reports

2. **Add Tests**: Create unit and integration tests:
   ```bash
   npm install --save-dev jest @types/jest ts-jest
   ```

3. **Deploy**: Use Docker or deploy to cloud:
   - Heroku
   - AWS (EC2, ECS, or Lambda)
   - Google Cloud
   - Azure

4. **Add CI/CD**: Set up GitHub Actions or similar

5. **Monitor**: Add monitoring tools:
   - Sentry for error tracking
   - New Relic for performance
   - DataDog for metrics

---

## 🎓 Learn More

- **Express.js**: https://expressjs.com/
- **TypeScript**: https://www.typescriptlang.org/
- **Prisma**: https://www.prisma.io/docs/
- **JWT**: https://jwt.io/
- **Zod**: https://zod.dev/
- **Swagger**: https://swagger.io/

---

## 💡 Pro Tips

1. **Use Prisma Studio** for quick database inspection:
   ```bash
   npm run prisma:studio
   ```

2. **Enable auto-completion** in your IDE for Prisma models

3. **Use environment-specific .env files**:
   - `.env.development`
   - `.env.production`
   - `.env.test`

4. **Review API docs** at `/api-docs` regularly

5. **Check logs** in `logs/` directory for debugging

---

**Need Help?** Check the main README.md or contact the development team.
