import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'GgBw8rKs+Q0geW0ZWO/dAWavdRWYHt5jqEddmpPf1+3pcJYDAxXuY1ppBKMxTchHHquiYhkORTIsLySmxgVcDqw==';  

export class AuthMiddleware {
  // Middleware to verify admin token
  public static requireAuth(req: Request, res: Response, next: NextFunction): void {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        res.status(401).json({
          success: false,
          error: 'Access token required. Please login as admin.'
        });
        return;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // FIX: Use type assertion instead of req.user
      (req as any).user = {
        username: decoded.username,
        role: decoded.role,
        timestamp: decoded.timestamp
      };

      next(); // Token is valid, proceed to route
    } catch (error) {
      console.error('Auth middleware error:', error);
      
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          error: 'Token expired. Please login again.'
        });
      } else if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          success: false,
          error: 'Invalid token. Please login again.'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Authentication failed'
        });
      }
    }
  }

  // Optional: Middleware to check auth but not require it
  public static optionalAuth(req: Request, res: Response, next: NextFunction): void {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        // FIX: Use type assertion here too
        (req as any).user = {
          username: decoded.username,
          role: decoded.role,
          timestamp: decoded.timestamp
        };
      }

      next(); // Proceed regardless of auth status
    } catch (error) {
      // If token is invalid, just continue without user info
      next();
    }
  }
}