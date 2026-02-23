class ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: any;

  constructor(success: boolean, message: string, data?: T, meta?: any) {
    this.success = success;
    this.message = message;
    if (data !== undefined) {
      this.data = data;
    }
    if (meta) {
      this.meta = meta;
    }
  }

  static success<T>(data?: T, message = 'Success', meta?: any) {
    return new ApiResponse<T>(true, message, data, meta);
  }

  static error(message: string) {
    return new ApiResponse(false, message);
  }

  static paginated<T>(data: T[], page: number, limit: number, total: number) {
    return new ApiResponse<T[]>(true, 'Success', data, {
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }
}

// Utility function to serialize objects containing BigInt values
export function serializeBigInt(obj: any): any {
  return JSON.parse(JSON.stringify(obj, (_key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
}

export default ApiResponse;
