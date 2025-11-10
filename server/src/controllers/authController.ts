import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

// Hardcoded admin credentials  
const ADMIN_CREDENTIALS = {
  username: 'generaladmin',
  password: 'smartinventory2025'
};

const JWT_SECRET = 'GgBw8rKs+Q0geW0ZWO/dAWavdRWYHt5jqEddmpPf1+3pcJYDAxXuY1ppBKMxTchHHquiYhkORTIsLySmxgVcDqw==';
const TOKEN_EXPIRY = '1h'; // 1 hour

export class AuthController {
  // Admin login
  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      // Validate input
      if (!username || !password) {
        res.status(400).json({
          success: false,
          error: 'Username and password are required'
        });
        return;
      }

      // Check credentials
      if (username !== ADMIN_CREDENTIALS.username || password !== ADMIN_CREDENTIALS.password) {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
        return;
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          username: ADMIN_CREDENTIALS.username,
          role: 'admin',
          timestamp: Date.now()
        },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
      );

      res.json({
        success: true,
        data: {
          token,
          expiresIn: 3600, // 1 hour in seconds
          username: ADMIN_CREDENTIALS.username
        },
        message: 'Login successful'
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Login failed'
      });
    }
  }

  // Verify token validity
  public static async verifyToken(req: Request, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      console.log('🔐 Token verification request received');
      console.log('📝 Token:', token ? `${token.substring(0, 20)}...` : 'No token');
      
      if (!token) {
        console.log('❌ No token provided');
        res.status(401).json({
          success: false,
          error: 'No token provided'
        });
        return;
      }

      // Verify token
      console.log('🔑 Attempting to verify JWT token...');
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      console.log('✅ Token verified successfully:', decoded);
      
      res.json({
        success: true,
        data: {
          valid: true,
          username: decoded.username,
          expiresAt: decoded.exp * 1000 // Convert to milliseconds
        }
      });
    } catch (error) {
      console.log('❌ Token verification failed:', error);
      res.status(401).json({
        success: false,
        data: {
          valid: false
        },
        error: 'Invalid or expired token'
      });
    }
  }

  // Logout (optional - client-side token removal)
  public static async logout(req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      message: 'Logout successful (client should remove token)'
    });
  }
}