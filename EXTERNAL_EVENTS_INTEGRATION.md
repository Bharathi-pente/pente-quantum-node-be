# External Events Integration Documentation

## Overview
Integrated an external events service API into the QuantumBilling backend to provide user events metrics. The integration follows a clean architecture with service layer, controller, and routes.

## Architecture

### 1. Service Layer (`externalEvents.service.ts`)
- **Location:** `backend/src/services/externalEvents.service.ts`
- **Purpose:** Handles all HTTP communication with the external events API
- **Features:**
  - Axios-based HTTP client with interceptors for logging
  - Configurable via environment variables
  - Comprehensive error handling
  - Request/response logging for debugging

### 2. Controller Layer (`externalEvents.controller.ts`)
- **Location:** `backend/src/controllers/externalEvents.controller.ts`
- **Purpose:** Handles request validation and response formatting
- **Endpoints:**
  - `GET /api/v1/user/events/:userId` - Get user events metrics
  - `GET /api/v1/user/events/health` - Check service health

### 3. Routes (`externalEvents.routes.ts`)
- **Location:** `backend/src/routes/externalEvents.routes.ts`
- **Authentication:** All routes protected with Keycloak authentication
- **Registered at:** `/api/v1/user/events`

## Environment Configuration

Add the following to your `.env` file:

```env
# External Events Service Configuration
EXTERNAL_EVENTS_BASE_URL=https://3qw7hp8r-8080.inc1.devtunnels.ms/v1
EXTERNAL_EVENTS_ORG_ID=org_acme
EXTERNAL_EVENTS_CUSTOMER_ID=org_acme
```

## API Endpoints

### Get User Events
```
GET /api/v1/user/events/:userId
```

**Authentication:** Required (Keycloak Bearer Token)

**Parameters:**
- `userId` (path, required): User ID to fetch events for
- `limit` (query, optional): Number of events (default: 100, max: 1000)
- `offset` (query, optional): Pagination offset (default: 0)

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/v1/user/events/user_acme_01?limit=100&offset=0" \
  -H "Authorization: Bearer YOUR_KEYCLOAK_TOKEN"
```

**Example Response:**
```json
{
  "success": true,
  "message": "User events retrieved successfully",
  "data": {
    "customer_id": "org_acme",
    "error_rate": "0.0%",
    "events": 4010,
    "org_id": "org_acme",
    "total_cost": "$60.1500",
    "total_tokens": "60.1k",
    "user_id": "user_acme_01"
  }
}
```

### Check Service Health
```
GET /api/v1/user/events/health
```

**Authentication:** Required (Keycloak Bearer Token)

**Example Response:**
```json
{
  "success": true,
  "message": "External events service is healthy",
  "data": {
    "baseURL": "https://3qw7hp8r-8080.inc1.devtunnels.ms/v1",
    "organizationId": "org_acme",
    "customerId": "org_acme"
  }
}
```

## Frontend Integration

### React/TypeScript Example

```typescript
// types/events.ts
export interface UserEventsData {
  customer_id: string;
  error_rate: string;
  events: number;
  org_id: string;
  total_cost: string;
  total_tokens: string;
  user_id: string;
}

export interface UserEventsResponse {
  success: boolean;
  message: string;
  data: UserEventsData;
}

// services/eventsApi.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export const eventsApi = {
  getUserEvents: async (
    userId: string,
    limit: number = 100,
    offset: number = 0,
    token: string
  ): Promise<UserEventsResponse> => {
    const response = await axios.get(
      `${API_BASE_URL}/user/events/${userId}`,
      {
        params: { limit, offset },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },
};

// components/UserEventsMetrics.tsx
import React, { useEffect, useState } from 'react';
import { eventsApi } from '../services/eventsApi';
import { UserEventsData } from '../types/events';

interface Props {
  userId: string;
  accessToken: string;
}

export const UserEventsMetrics: React.FC<Props> = ({ userId, accessToken }) => {
  const [events, setEvents] = useState<UserEventsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await eventsApi.getUserEvents(userId, 100, 0, accessToken);
        setEvents(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch user events');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (userId && accessToken) {
      fetchEvents();
    }
  }, [userId, accessToken]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!events) return null;

  return (
    <div className="user-events-metrics">
      <h2>My Events</h2>
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Total Events</h3>
          <p>{events.events.toLocaleString()}</p>
        </div>
        <div className="metric-card">
          <h3>Total Cost</h3>
          <p>{events.total_cost}</p>
        </div>
        <div className="metric-card">
          <h3>Total Tokens</h3>
          <p>{events.total_tokens}</p>
        </div>
        <div className="metric-card">
          <h3>Error Rate</h3>
          <p>{events.error_rate}</p>
        </div>
      </div>
    </div>
  );
};
```

### Usage in Frontend Page

```typescript
// pages/UserEventsPage.tsx
import React from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { UserEventsMetrics } from '../components/UserEventsMetrics';

export const UserEventsPage: React.FC = () => {
  const { keycloak } = useKeycloak();
  
  // Get user ID from Keycloak token or your user context
  const userId = keycloak.tokenParsed?.preferred_username || 'user_acme_01';

  return (
    <div className="page-container">
      <UserEventsMetrics 
        userId={userId}
        accessToken={keycloak.token!}
      />
    </div>
  );
};
```

## Testing

### Using cURL
```bash
# Get user events
curl -X GET "http://localhost:3000/api/v1/user/events/user_acme_01?limit=100&offset=0" \
  -H "Authorization: Bearer YOUR_KEYCLOAK_TOKEN"

# Check service health
curl -X GET "http://localhost:3000/api/v1/user/events/health" \
  -H "Authorization: Bearer YOUR_KEYCLOAK_TOKEN"
```

### Using Postman
1. Set method to GET
2. URL: `http://localhost:3000/api/v1/user/events/user_acme_01`
3. Add query params: `limit=100`, `offset=0`
4. Add header: `Authorization: Bearer YOUR_KEYCLOAK_TOKEN`

## Error Handling

The integration includes comprehensive error handling:

1. **External API Errors:** Returns proper error messages from the external service
2. **Network Errors:** Handles timeouts and connection issues
3. **Validation Errors:** Validates userId, limit, and offset parameters
4. **Authentication Errors:** Keycloak middleware ensures proper authentication

## Files Created/Modified

### New Files:
- `backend/src/services/externalEvents.service.ts`
- `backend/src/controllers/externalEvents.controller.ts`
- `backend/src/routes/externalEvents.routes.ts`

### Modified Files:
- `backend/src/routes/index.ts` - Added route registration
- `backend/.env.example` - Added configuration variables
- `backend/package.json` - Added axios dependency

## Dependencies Added
- `axios` - HTTP client library
- `@types/axios` - TypeScript types for axios (dev dependency)

## Notes

1. **No Impact on Existing Code:** This integration is completely isolated and doesn't affect any existing functionality
2. **Scalable:** Easy to add more endpoints from the external service
3. **Configurable:** All external service details controlled via environment variables
4. **Secure:** All routes protected with Keycloak authentication
5. **Production Ready:** Includes logging, error handling, and proper TypeScript types

## Future Enhancements

To add more endpoints from the external service:

1. Add new methods to `externalEvents.service.ts`
2. Add new controller methods in `externalEvents.controller.ts`
3. Add new routes in `externalEvents.routes.ts`

Example:
```typescript
// Service method
async getEventsAnalytics(userId: string): Promise<any> {
  const url = `/analytics/user/${userId}`;
  const response = await this.axiosInstance.get(url);
  return response.data;
}

// Controller method
getEventsAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const analytics = await externalEventsService.getEventsAnalytics(userId);
  return res.status(200).json(
    ApiResponse.success(analytics, 'Analytics retrieved successfully')
  );
});

// Route
router.get('/:userId/analytics', externalEventsController.getEventsAnalytics);
```
