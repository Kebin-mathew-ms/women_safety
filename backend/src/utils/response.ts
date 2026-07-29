import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
  timestamp: string;
}

export class ResponseHelper {
  /**
   * Send a success response
   */
  static success<T>(
    res: Response,
    message: string,
    data?: T,
    statusCode = 200
  ): Response<ApiResponse<T>> {
    const responseBody: ApiResponse<T> = {
      success: true,
      message,
      data: data ?? undefined,
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(responseBody);
  }

  /**
   * Send an error response
   */
  static error(
    res: Response,
    message: string,
    statusCode = 500,
    errors?: any
  ): Response<ApiResponse<null>> {
    const responseBody: ApiResponse<null> = {
      success: false,
      message,
      errors: errors ?? undefined,
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(responseBody);
  }
}
export default ResponseHelper;
