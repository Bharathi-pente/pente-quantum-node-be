import axios from 'axios';
import logger from '../config/logger';

/**
 * Interface for user events response from external service
 */
export interface UserEventsResponse {
  customer_id: string;
  error_rate: string;
  events: number;
  org_id: string;
  total_cost: string;
  total_tokens: string;
  user_id: string;
}

/**
 * External Events Service
 * Handles all communication with the external events API
 */
class ExternalEventsService {
  private axiosInstance: any;
  private baseURL: string;
  private organizationId: string;
  private customerId: string;

  constructor() {
    this.baseURL = process.env.EXTERNAL_EVENTS_BASE_URL || 'http://3.88.179.52:8011';
    this.organizationId = process.env.EXTERNAL_EVENTS_ORG_ID || 'org_acme';
    this.customerId = process.env.EXTERNAL_EVENTS_CUSTOMER_ID || 'org_acme';

    // Create axios instance with default configuration
    const timeoutMs = Number(process.env.EXTERNAL_EVENTS_TIMEOUT_MS || '5000');
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: timeoutMs, // configurable timeout for external calls
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    logger.info('ExternalEventsService configured', { baseURL: this.baseURL, timeoutMs });

    // Add request interceptor for logging
    this.axiosInstance.interceptors.request.use(
      (config: any) => {
        logger.info('External API Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          params: config.params,
        });
        return config;
      },
      (error: any) => {
        logger.error('External API Request Error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.axiosInstance.interceptors.response.use(
      (response: any) => {
        logger.info('External API Response', {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      (error: any) => {
        logger.error('External API Response Error', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
          data: error.response?.data,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get user events metrics
   * @param userId - User ID
   * @param limit - Number of events to retrieve (default: 100)
   * @param offset - Offset for pagination (default: 0)
   * @returns User events response
   */
  async getUserEvents(
    userId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<UserEventsResponse> {
    try {
      const url = `/v1/events/organization/${this.organizationId}/customer/${this.customerId}/user/${userId}`;
      
      const response = await this.axiosInstance.get(url, {
        params: {
          limit,
          offset,
        },
      });

      return response.data;
    } catch (error: any) {
      if (error.response || error.request) {
        const axiosError = error;
        
        if (axiosError.response) {
          // External API returned an error response
          logger.error('External API returned error', {
            status: axiosError.response.status,
            data: axiosError.response.data,
            userId,
          });
          
          throw new Error(
            `External API error: ${axiosError.response.status} - ${
              JSON.stringify(axiosError.response.data)
            }`
          );
        } else if (axiosError.request) {
          // Request was made but no response received
          logger.error('No response from external API', {
            userId,
            error: axiosError.message,
          });
          throw new Error('External API is not responding. Please try again later.');
        }
      }
      
      // Generic error
      logger.error('Unexpected error in getUserEvents', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Failed to fetch user events. Please try again later.');
    }
  }

  /**
   * Get raw events list for a user (includes count and events array)
   */
  async getUserEventsList(userId: string, limit: number = 100, offset: number = 0) {
    try {
      const url = `/v1/events/organization/${this.organizationId}/customer/${this.customerId}/user/${userId}`;
      const response = await this.axiosInstance.get(url, {
        params: { limit, offset },
      });
      // Normalize events to an array when external service returns `null`
      const data = response.data ?? {};
      const events = Array.isArray(data.events) ? data.events : [];
      const count = typeof data.count === 'number' ? data.count : events.length;

      return {
        ...data,
        events,
        count,
      };
    } catch (error: any) {
      logger.error('Failed to fetch events list', { userId, error: error?.message });

      // On timeout or network errors, return a safe empty result instead of throwing
      // so frontend can render an empty state rather than a 500.
      if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        return {
          count: 0,
          customer_id: this.customerId,
          events: [],
          limit,
          offset,
          org_id: this.organizationId,
          user_id: userId,
        };
      }

      throw error;
    }
  }

  /**
   * Get user token usage metrics from external API
   */
  async getUserTokenUsage(userId: string, limit: number = 100, offset: number = 0) {
    try {
      const url = `/v1/organization/${this.organizationId}/customers/${this.customerId}/users/${userId}/metrics`;
      const response = await this.axiosInstance.get(url, {
        params: { limit, offset },
      });
      
      return response.data;
    } catch (error: any) {
      logger.error('Failed to fetch token usage metrics', { userId, error: error?.message });
      
      // Return safe defaults on error
      return {
        org_id: this.organizationId,
        customer_id: this.customerId,
        user_id: userId,
        total_tokens: 0,
        total_cost: 0,
        total_events: 0,
      };
    }
  }

  /**
   * Get base URL for external service
   */
  getBaseURL(): string {
    return this.baseURL;
  }

  /**
   * Get organization ID
   */
  getOrganizationId(): string {
    return this.organizationId;
  }

  /**
   * Get customer ID
   */
  getCustomerId(): string {
    return this.customerId;
  }
}

// Export singleton instance
export default new ExternalEventsService();
