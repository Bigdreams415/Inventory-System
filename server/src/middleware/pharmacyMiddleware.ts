// server/src/middleware/pharmacyMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import { dbService } from '../models/database';

interface Pharmacy {
  id: string;
  name: string;
  location: string;
  address?: string;
  phone_number?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

let currentPharmacy: Pharmacy | null = null;

export const PharmacyMiddleware = {
  // Middleware to set pharmacy ID from request - MAKE IT OPTIONAL
  async setPharmacyFromRequest(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      // Skip pharmacy setting for pharmacy creation endpoints
      if (req.path === '/pharmacies' && req.method === 'POST') {
        console.log('🔄 Skipping pharmacy middleware for pharmacy creation');
        next();
        return;
      }

      // Priority order: header > query param > current stored pharmacy > first active pharmacy
      const pharmacyId = req.headers['x-pharmacy-id'] as string || 
                        req.query.pharmacyId as string ||
                        (currentPharmacy?.id || await getFirstActivePharmacyId());

      if (!pharmacyId) {
        console.log('⚠️ No pharmacy available yet - continuing without pharmacy context');
        // Don't fail - just continue without pharmacy context
        next();
        return;
      }

      // Get pharmacy from database
      const pharmacy = await getPharmacyById(pharmacyId);
      
      if (!pharmacy) {
        console.log('⚠️ Pharmacy not found - continuing without pharmacy context');
        next();
        return;
      }

      // Set pharmacy in request object for controllers to use
      req.pharmacyId = pharmacy.id;
      req.pharmacy = pharmacy;

      console.log(`🏪 Pharmacy middleware: Using ${pharmacy.name} (${pharmacy.id})`);
      
      next();
    } catch (error) {
      console.error('Error in pharmacy middleware:', error);
      // Don't fail the request - just continue without pharmacy context
      next();
    }
  },

  // ... rest of your methods remain the same
  async getCurrentPharmacy(_req: Request, res: Response): Promise<void> {
    try {
      if (!currentPharmacy) {
        currentPharmacy = await getFirstActivePharmacy();
      }

      if (!currentPharmacy) {
        res.json({
          success: true,
          data: null, // Return null instead of error
          message: 'No pharmacy available. Please create a pharmacy first.'
        });
        return;
      }

      res.json({
        success: true,
        data: currentPharmacy
      });
    } catch (error) {
      console.error('Error getting current pharmacy:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get current pharmacy'
      });
    }
  },

  async switchPharmacy(req: Request, res: Response): Promise<void> {
    try {
      const { pharmacyId } = req.body;
      
      if (!pharmacyId) {
        res.status(400).json({
          success: false,
          error: 'Pharmacy ID is required'
        });
        return;
      }

      const pharmacy = await getPharmacyById(pharmacyId);
      
      if (!pharmacy) {
        res.status(404).json({
          success: false,
          error: 'Pharmacy not found'
        });
        return;
      }

      currentPharmacy = pharmacy;
      
      res.json({
        success: true,
        data: pharmacy
      });
    } catch (error) {
      console.error('Error switching pharmacy:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to switch pharmacy'
      });
    }
  },

  async getAllPharmacies(_req: Request, res: Response): Promise<void> {
    try {
      const pharmacies = await getAllActivePharmacies();
      
      res.json({
        success: true,
        data: pharmacies
      });
    } catch (error) {
      console.error('Error getting all pharmacies:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get pharmacies'
      });
    }
  }
};

// Database helper functions (keep the same)
async function getPharmacyById(id: string): Promise<Pharmacy | null> {
  try {
    const pharmacy = await dbService.get<Pharmacy>(
      'SELECT * FROM pharmacies WHERE id = ? AND is_active = 1',
      [id]
    );
    return pharmacy || null;
  } catch (error) {
    console.error('Error getting pharmacy by ID:', error);
    return null;
  }
}

async function getFirstActivePharmacy(): Promise<Pharmacy | null> {
  try {
    const pharmacy = await dbService.get<Pharmacy>(
      'SELECT * FROM pharmacies WHERE is_active = 1 ORDER BY created_at LIMIT 1'
    );
    return pharmacy || null;
  } catch (error) {
    console.error('Error getting first active pharmacy:', error);
    return null;
  }
}

async function getFirstActivePharmacyId(): Promise<string | null> {
  const pharmacy = await getFirstActivePharmacy();
  return pharmacy?.id || null;
}

async function getAllActivePharmacies(): Promise<Pharmacy[]> {
  try {
    const pharmacies = await dbService.all<Pharmacy>(
      'SELECT * FROM pharmacies WHERE is_active = 1 ORDER BY created_at'
    );
    return pharmacies || [];
  } catch (error) {
    console.error('Error getting all active pharmacies:', error);
    return [];
  }
}

// Extend Express Request type to include pharmacy info
declare global {
  namespace Express {
    interface Request {
      pharmacyId?: string;
      pharmacy?: Pharmacy;
    }
  }
}