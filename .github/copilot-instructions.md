# Project Coding Standards (Backend - Node.js + Express)

## 1. Tech Stack Awareness
- Node.js + Express.js
- MongoDB with Mongoose
- JWT-based Authentication
- RESTful API architecture

Copilot MUST always generate code aligned with this stack.

---

## 2. Architecture Rules (STRICT)
- Follow clean architecture:
  - Routes → handle endpoints only
  - Controllers → handle request/response
  - Services → business logic
  - Models → database schema
  - Middlewares → auth, validation, error handling

❌ NEVER write business logic inside routes  
❌ NEVER access database directly from controllers (use services)

---

## 3. Mandatory Project Structure
src/
├── controllers/
├── services/
├── models/
├── routes/
├── middlewares/
├── utils/
├── config/

- Each module must be separated (no monolithic files)
- Use index files for cleaner imports when needed

---

## 4. Naming Conventions
- Variables & functions → camelCase
- Constants → UPPER_CASE
- Files → kebab-case.js
- Classes / Models → PascalCase

Examples:
- getUserProfile
- createOrganizationService
- USER_ROLE_ADMIN

---

## 5. API Response Standard (STRICT FORMAT)

### Success Response
```js
{
  success: true,
  message: "Data fetched successfully",
  data: {},
}

Error Response
{
  success: false,
  message: "Something went wrong",
  error: error.message,
}
NEVER send raw data without wrapper
ALWAYS include success

6. Error Handling (MANDATORY)
Use try/catch in ALL async controllers
Pass errors to centralized error middleware

Example:

try {
  const data = await serviceFunction();
  res.status(200).json({ success: true, data });
} catch (error) {
  next(error);
}
7. Async Code Rules
ALWAYS use async/await
NEVER use .then() or callbacks
Avoid nested async calls (keep it flat)
8. 🔐 CRITICAL: Multi-Tenant Data Isolation (NON-NEGOTIABLE)

This project is multi-user. Data MUST be isolated.

RULES:
EVERY database query MUST include userId
NEVER fetch global/shared data
NEVER trust client-provided userId
ALWAYS extract userId from JWT (req.user.id)
Example (CORRECT):
const data = await Model.find({ userId: req.user.id });
Example (WRONG ❌):
const data = await Model.find(); // DATA LEAK BUG
Applies to:
find
findOne
update
delete
aggregation
9. Authentication & Authorization
Use JWT middleware for protected routes
Attach user to request:
req.user = decodedToken;
NEVER trust frontend user identity
Implement role-based access when required
10. Validation Rules
Validate ALL inputs (body, params, query)
Use validation libraries (Joi / Zod preferred)
Reject invalid requests with 400 status
11. Database Standards (Mongoose)
Always define schema validations
Use timestamps: true
Avoid unstructured data
Use indexing where needed
Multi-tenant schema rule:
userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: true,
}
12. Service Layer Rules
Services handle:
DB operations
Business logic
Controllers should be thin

Example:

// controller
const data = await organizationService.getAll(req.user.id);

// service
return Organization.find({ userId });
13. Security Best Practices
Never expose:
passwords
tokens
internal errors
Use environment variables for secrets
Sanitize inputs to prevent injection
14. Performance Rules
Avoid unnecessary DB calls
Use .select() to limit fields
Use pagination for large data
15. Logging
Use structured logging (console for dev only)
Avoid console.log in production
16. Reusability Rules
Extract reusable logic into:
services
utils
Avoid duplicate code
17. Strict Prohibitions 🚫

Copilot MUST NOT:

Write queries without userId
Mix controller + service logic
Return inconsistent API responses
Use .then() or callbacks
Expose sensitive data
Create large unstructured files
18. Copilot Behavior Instructions
Always follow existing project structure
Reuse existing services if available
Do NOT duplicate logic
Prefer consistency over creativity
If unclear → generate safest secure implementation
19. Example Full Flow (REFERENCE)

Route:

router.get("/", authMiddleware, controller.getAll);

Controller:

const getAll = async (req, res, next) => {
  try {
    const data = await service.getAll(req.user.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

Service:

const getAll = async (userId) => {
  return Model.find({ userId });
};
20. Golden Rule ⭐

If a query does NOT include userId
👉 IT IS A BUG
👉 DO NOT GENERATE THAT CODE


---
---

# 🔥 Why This Is Powerful (For You)

This will:
- ✅ Fix your **data leakage issue permanently**
- ✅ Force **clean architecture**
- ✅ Make Copilot act like **senior backend dev**
- ✅ Generate **secure + scalable APIs**
- ✅ Reduce debugging time massively

---

