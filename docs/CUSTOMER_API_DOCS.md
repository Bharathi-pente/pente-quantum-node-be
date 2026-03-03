# Customer API Documentation

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
Include JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Create Customer

### Endpoint
```
POST /customers
```

### Request Body
```json
{
  "name": "string",           // Required
  "email": "string",          // Required
  "org_id": "uuid",           // Required
  "product_id": "uuid",       // Optional
  "status": "string",         // Optional: "active", "trial", "churned", "suspended"
  "mrr": "number",            // Optional
  "credit_balance": "number", // Optional
  "health_score": "number"    // Optional: 0-100
}
```

### Success Response (201)
```json
{
  "success": true,
  "message": "Customer created successfully",
  "data": {
    "id": "uuid",
    "name": "string",
    "email": "string",
    "org_id": "uuid",
    "product_id": "uuid",
    "status": "string",
    "mrr": 0,
    "credit_balance": 0,
    "health_score": 75,
    "logo_initials": "string",
    "created_at": "2026-02-19T10:58:40.000Z",
    "products": {
      "name": "string",
      "base_price": 0
    }
  }
}
```

### Error Responses
- `400`: Validation error
- `409`: Customer already exists
- `500`: Server error

## Get All Customers

### Endpoint
```
GET /customers
```

### Query Parameters
- `page` (optional): number, default 1
- `limit` (optional): number, default 10
- `search` (optional): string
- `status` (optional): string

### Success Response (200)
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": "uuid",
        "name": "string",
        "email": "string",
        "status": "string",
        "mrr": 0,
        "health_score": 75,
        "created_at": "2026-02-19T10:58:40.000Z",
        "products": {
          "name": "string",
          "base_price": 0
        }
      }
    ],
    "total": 5,
    "page": 1,
    "limit": 10
  }
}
```

## Get Customer by ID

### Endpoint
```
GET /customers/:id
```

### Path Parameters
- `id`: Customer UUID

### Success Response (200)
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "email": "string",
    "org_id": "uuid",
    "product_id": "uuid",
    "status": "string",
    "mrr": 0,
    "credit_balance": 0,
    "health_score": 75,
    "logo_initials": "string",
    "created_at": "2026-02-19T10:58:40.000Z",
    "products": {
      "name": "string",
      "base_price": 0
    }
  }
}
```

## Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "statusCode": 400,
    "isOperational": true
  }
}
```