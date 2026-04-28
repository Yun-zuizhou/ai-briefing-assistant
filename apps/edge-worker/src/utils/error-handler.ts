/**
 * @fileoverview 统一API错误响应处理模块
 *
 * 提供标准化的错误响应格式、错误码枚举和错误处理工具函数。
 * 所有API错误响应均遵循 { error, code, status } 结构。
 */

import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'

/** 标准API错误响应结构 */
export interface ApiErrorResponse {
  /** 人类可读的错误描述 */
  error: string
  /** 机器可读的错误码 */
  code: string
  /** HTTP状态码 */
  status: number
}

/** 标准化错误码枚举，按HTTP状态码分组 */
export enum ErrorCode {
  // 认证相关 (401)
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  INVALID_SESSION = 'INVALID_SESSION',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // 授权相关 (403)
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // 客户端错误 (400)
  BAD_REQUEST = 'BAD_REQUEST',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // 资源相关 (404)
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',

  // 服务器错误 (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',

  // 配置错误 (503)
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
}

/**
 * 根据错误码获取对应的HTTP状态码
 * @param code - 错误码
 * @returns HTTP状态码 (400, 401, 403, 404, 500, 503)
 */
function getStatusFromCode(code: ErrorCode): number {
  if (code.startsWith('AUTH') || code === 'INVALID_SESSION' || code === 'SESSION_EXPIRED') {
    return 401
  }
  if (code.startsWith('FORBIDDEN') || code === 'INSUFFICIENT_PERMISSIONS') {
    return 403
  }
  if (code === 'NOT_FOUND' || code === 'RESOURCE_NOT_FOUND') {
    return 404
  }
  if (code === 'BAD_REQUEST' || code === 'VALIDATION_ERROR' || code === 'MISSING_REQUIRED_FIELD') {
    return 400
  }
  if (code === 'SERVICE_UNAVAILABLE' || code === 'CONFIGURATION_ERROR') {
    return 503
  }
  return 500
}

/**
 * 获取错误码对应的默认错误消息
 * @param code - 错误码
 * @returns 默认错误描述文本
 */
function getDefaultMessage(code: ErrorCode): string {
  const messages: Record<ErrorCode, string> = {
    [ErrorCode.AUTHENTICATION_REQUIRED]: 'Authentication required. Please log in.',
    [ErrorCode.INVALID_SESSION]: 'Invalid session. Please log in again.',
    [ErrorCode.SESSION_EXPIRED]: 'Session expired. Please log in again.',
    [ErrorCode.FORBIDDEN]: 'Access forbidden.',
    [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions for this operation.',
    [ErrorCode.BAD_REQUEST]: 'Bad request.',
    [ErrorCode.VALIDATION_ERROR]: 'Validation error. Please check your input.',
    [ErrorCode.MISSING_REQUIRED_FIELD]: 'Missing required field.',
    [ErrorCode.NOT_FOUND]: 'Not found.',
    [ErrorCode.RESOURCE_NOT_FOUND]: 'The requested resource was not found.',
    [ErrorCode.INTERNAL_ERROR]: 'An internal server error occurred.',
    [ErrorCode.DATABASE_ERROR]: 'A database error occurred.',
    [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'An external service error occurred.',
    [ErrorCode.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable.',
    [ErrorCode.CONFIGURATION_ERROR]: 'Service configuration error.',
  }
  return messages[code] || 'An error occurred.'
}

/**
 * 创建标准化的API错误响应对象
 *
 * @param code - 错误码，决定HTTP状态码和默认消息
 * @param customMessage - 可选的自定义错误消息，覆盖默认消息
 * @returns 标准格式的错误响应对象 { error, code, status }
 *
 * @example
 * ```ts
 * createErrorResponse(ErrorCode.NOT_FOUND, 'User not found')
 * // => { error: 'User not found', code: 'NOT_FOUND', status: 404 }
 * ```
 */
export function createErrorResponse(
  code: ErrorCode,
  customMessage?: string
): ApiErrorResponse {
  const status = getStatusFromCode(code)
  return {
    error: customMessage || getDefaultMessage(code),
    code,
    status,
  }
}

function readLoggingMode(c: Context): string {
  const env = c.env as Record<string, string | undefined> | undefined
  return String(env?.ERROR_LOGGING || '').toLowerCase()
}

function shouldLogApiError(err: Error, c: Context): boolean {
  const mode = readLoggingMode(c)
  if (['0', 'false', 'off', 'silent'].includes(mode)) {
    return false
  }
  if (err instanceof HTTPException && err.status < 500) {
    return mode === 'verbose'
  }
  return true
}

/**
 * 全局API错误处理器
 *
 * 将各类错误转换为标准化的JSON响应。用于Hono应用的 `app.onError` 钩子。
 * 自动识别HTTPException并映射到对应的错误码，其他错误统一返回500。
 *
 * @param err - 捕获的错误对象
 * @param c - Hono上下文
 * @returns JSON格式的错误响应
 *
 * @example
 * ```ts
 * app.onError((err, c) => handleApiError(err, c))
 * ```
 */
export function handleApiError(err: Error, c: Context): Response {
  if (shouldLogApiError(err, c)) {
    console.error('API Error:', err)
  }

  if (err instanceof HTTPException) {
    const status = err.status
    let code: ErrorCode
    let message = err.message

    switch (status) {
      case 401:
        code = ErrorCode.AUTHENTICATION_REQUIRED
        if (message.includes('expired')) {
          code = ErrorCode.SESSION_EXPIRED
        } else if (message.includes('invalid')) {
          code = ErrorCode.INVALID_SESSION
        }
        break
      case 403:
        code = ErrorCode.FORBIDDEN
        break
      case 404:
        code = ErrorCode.NOT_FOUND
        break
      case 400:
        code = ErrorCode.BAD_REQUEST
        break
      case 503:
        code = ErrorCode.SERVICE_UNAVAILABLE
        break
      default:
        code = ErrorCode.INTERNAL_ERROR
    }

    return c.json(createErrorResponse(code, message), status)
  }

  return c.json(createErrorResponse(ErrorCode.INTERNAL_ERROR), 500)
}
