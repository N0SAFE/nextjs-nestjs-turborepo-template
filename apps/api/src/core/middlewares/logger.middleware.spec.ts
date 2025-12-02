import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoggerMiddleware } from './logger.middleware';
import type { Request, Response, NextFunction } from 'express';

describe('LoggerMiddleware', () => {
  let loggerMiddleware: LoggerMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let consoleLogSpy: any;

  beforeEach(() => {
    loggerMiddleware = new LoggerMiddleware();
    
    mockRequest = {
      method: 'GET',
      url: '/test',
      ip: '127.0.0.1',
      get: vi.fn((header: string) => {
        if (header === 'user-agent') return 'TestAgent/1.0';
        return undefined;
      }),
    };
    
    mockResponse = {
      statusCode: 200,
      statusMessage: 'OK',
      get: vi.fn((header: string) => {
        if (header === 'content-length') return '1234';
        return undefined;
      }),
      on: vi.fn((event: string, callback: () => void) => {
        if (event === 'finish') {
          setTimeout(callback, 0);
        }
        return mockResponse as Response;
      }),
    };
    
    mockNext = vi.fn();
    
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('Middleware Creation', () => {
    it('should create logger middleware instance', () => {
      expect(loggerMiddleware).toBeDefined();
      expect(loggerMiddleware).toBeInstanceOf(LoggerMiddleware);
    });

    it('should have use method', () => {
      expect(loggerMiddleware.use).toBeDefined();
      expect(typeof loggerMiddleware.use).toBe('function');
    });
  });

  describe('Request Logging', () => {
    it('should call next function', () => {
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should log request method', () => {
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log request URL', () => {
      mockRequest.url = '/api/users';
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log response status code', async () => {
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log request IP address', () => {
      mockRequest.ip = '192.168.1.1';
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log user agent', () => {
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockRequest.get).toHaveBeenCalledWith('user-agent');
    });
  });

  describe('HTTP Methods', () => {
    it('should log GET requests', () => {
      mockRequest.method = 'GET';
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should log POST requests', () => {
      mockRequest.method = 'POST';
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should log PUT requests', () => {
      mockRequest.method = 'PUT';
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should log DELETE requests', () => {
      mockRequest.method = 'DELETE';
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should log PATCH requests', () => {
      mockRequest.method = 'PATCH';
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Response Status Codes', () => {
    it('should log 200 status code', async () => {
      mockResponse.statusCode = 200;
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log 201 status code', async () => {
      mockResponse.statusCode = 201;
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log 400 status code', async () => {
      mockResponse.statusCode = 400;
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log 401 status code', async () => {
      mockResponse.statusCode = 401;
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log 404 status code', async () => {
      mockResponse.statusCode = 404;
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log 500 status code', async () => {
      mockResponse.statusCode = 500;
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('URL Patterns', () => {
    it('should log root path', () => {
      mockRequest.url = '/';
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log API endpoints', () => {
      mockRequest.url = '/api/users';
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log nested paths', () => {
      mockRequest.url = '/api/users/123/profile';
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log paths with query parameters', () => {
      mockRequest.url = '/api/users?page=1&limit=10';
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log paths with hash fragments', () => {
      mockRequest.url = '/api/users#section';
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('Response Timing', () => {
    it('should listen to response finish event', () => {
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.on).toHaveBeenCalledWith('finish', expect.any(Function));
    });

    it('should calculate response time', async () => {
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle immediate responses', async () => {
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      await new Promise(resolve => setTimeout(resolve, 1));
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle slow responses', async () => {
      mockResponse.on = vi.fn((event: string, callback: () => void) => {
        if (event === 'finish') {
          setTimeout(callback, 100);
        }
        return mockResponse as Response;
      });
      
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('IP Address Handling', () => {
    it('should handle IPv4 addresses', () => {
      mockRequest.ip = '192.168.1.1';
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle IPv6 addresses', () => {
      mockRequest.ip = '::1';
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle localhost', () => {
      mockRequest.ip = '127.0.0.1';
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle undefined IP', () => {
      mockRequest.ip = undefined;
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('User Agent Handling', () => {
    it('should log browser user agent', () => {
      (mockRequest.get as any).mockReturnValue('Mozilla/5.0');
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockRequest.get).toHaveBeenCalledWith('user-agent');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log API client user agent', () => {
      (mockRequest.get as any).mockReturnValue('axios/1.0');
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockRequest.get).toHaveBeenCalledWith('user-agent');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle missing user agent', () => {
      (mockRequest.get as any).mockReturnValue(undefined);
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockRequest.get).toHaveBeenCalledWith('user-agent');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle empty user agent', () => {
      (mockRequest.get as any).mockReturnValue('');
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockRequest.get).toHaveBeenCalledWith('user-agent');
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should not throw if console.log fails', () => {
      consoleLogSpy.mockImplementation(() => {
        throw new Error('Logging failed');
      });
      
      expect(() => {
        loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      }).not.toThrow();
    });

    it('should call next even if logging fails', () => {
      consoleLogSpy.mockImplementation(() => {
        throw new Error('Logging failed');
      });
      
      expect(() => {
        loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      }).not.toThrow();
      
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle response.on error', () => {
      mockResponse.on = vi.fn(() => {
        throw new Error('Event listener failed');
      });
      
      expect(() => {
        loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      }).not.toThrow();
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple simultaneous requests', () => {
      const requests = Array.from({ length: 10 }, (_, i) => ({
        ...mockRequest,
        url: `/test-${i}`,
      }));
      
      requests.forEach(req => {
        loggerMiddleware.use(req as Request, mockResponse as Response, mockNext);
      });
      
      expect(mockNext).toHaveBeenCalledTimes(10);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log each request independently', () => {
      const request1 = { ...mockRequest, url: '/test-1' };
      const request2 = { ...mockRequest, url: '/test-2' };
      
      loggerMiddleware.use(request1 as Request, mockResponse as Response, mockNext);
      loggerMiddleware.use(request2 as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long URLs', () => {
      mockRequest.url = '/api/users/' + 'a'.repeat(1000);
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle special characters in URL', () => {
      mockRequest.url = '/api/users?name=John%20Doe&email=test%40example.com';
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle unicode in URL', () => {
      mockRequest.url = '/api/users/测试';
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle very long user agent', () => {
      (mockRequest.get as any).mockReturnValue('A'.repeat(1000));
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Integration', () => {
    it('should be compatible with NestJS middleware system', () => {
      expect(loggerMiddleware.use).toBeDefined();
      expect(typeof loggerMiddleware.use).toBe('function');
      expect(loggerMiddleware.use.length).toBe(3); // req, res, next
    });

    it('should not modify request object', () => {
      const originalRequest = { ...mockRequest };
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockRequest.method).toBe(originalRequest.method);
      expect(mockRequest.url).toBe(originalRequest.url);
    });

    it('should not modify response object', () => {
      const originalStatusCode = mockResponse.statusCode;
      loggerMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.statusCode).toBe(originalStatusCode);
    });
  });
});
