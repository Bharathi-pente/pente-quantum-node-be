export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface FilterQuery extends PaginationQuery {
  search?: string;
  status?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface JWTPayload {
  id: string;
  email: string;
  orgId: string;
  roleId: string;
  permissions?: string[];
}

export interface ApiResponseType<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
