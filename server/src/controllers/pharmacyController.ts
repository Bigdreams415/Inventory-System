// server/src/controllers/pharmacyController.ts

import { Request, Response } from 'express';
import { Database } from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';

const MAX_PHARMACIES = 5;

interface PharmacyData {
  id?: string;
  name: string;
  location: string;
  address?: string;
  phone_number?: string;
  email?: string;
  is_active?: number;
  created_at?: string;
  updated_at?: string;
}

export class PharmacyController {
  constructor(private db: Database) {}

  private async query<T>(sql: string, params: any[] = []): Promise<T> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row as T);
      });
    });
  }

  private async queryAll<T>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as T[]);
      });
    });
  }

  private async run(sql: string, params: any[] = []): Promise<{ changes: number }> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  private async getActivePharmacyCount(): Promise<number> {
    const result = await this.query<{ count: number }>(
      'SELECT COUNT(*) as count FROM pharmacies WHERE is_active = 1'
    );
    return result?.count || 0;
  }

  getAllPharmacies = async (_: Request, res: Response): Promise<void> => {
    try {
      console.log('🔄 Fetching all active pharmacies...');
      
      const rows = await this.queryAll<PharmacyData>(
        'SELECT * FROM pharmacies WHERE is_active = 1 ORDER BY created_at DESC'
      );
      
      console.log(`✅ Found ${rows.length} active pharmacies`);
      res.json({ success: true, data: rows });
    } catch (error) {
      console.error('❌ Error fetching pharmacies:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch pharmacies' });
    }
  };

  getPharmacyById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      console.log(`🔄 Fetching pharmacy by ID: ${id}`);
      
      const row = await this.query<PharmacyData>(
        'SELECT * FROM pharmacies WHERE id = ? AND is_active = 1',
        [id]
      );
      
      if (!row) {
        console.log(`❌ Pharmacy not found: ${id}`);
        res.status(404).json({ success: false, error: 'Pharmacy not found' });
        return;
      }
      
      console.log(`✅ Found pharmacy: ${row.name}`);
      res.json({ success: true, data: row });
    } catch (error) {
      console.error('❌ Error fetching pharmacy:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch pharmacy' });
    }
  };

  createPharmacy = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, location, address, phone_number, email } = req.body;

      if (!name || !location) {
        console.log('❌ Validation failed: Name and location are required');
        res.status(400).json({ success: false, error: 'Name and location are required' });
        return;
      }

      const currentCount = await this.getActivePharmacyCount();
      console.log(`📊 Current pharmacy count: ${currentCount}/${MAX_PHARMACIES}`);
      
      if (currentCount >= MAX_PHARMACIES) {
        console.log('❌ Pharmacy limit reached');
        res.status(400).json({ 
          success: false,
          error: `Maximum limit of ${MAX_PHARMACIES} pharmacies reached. Please delete an existing pharmacy to create a new one.` 
        });
        return;
      }

      const newPharmacy: PharmacyData = {
        id: `pharmacy_${uuidv4()}`,
        name,
        location,
        address: address || '',
        phone_number: phone_number || '',
        email: email || '',
        is_active: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await this.run(
        `INSERT INTO pharmacies (id, name, location, address, phone_number, email, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newPharmacy.id,
          newPharmacy.name,
          newPharmacy.location,
          newPharmacy.address,
          newPharmacy.phone_number,
          newPharmacy.email,
          newPharmacy.is_active,
          newPharmacy.created_at,
          newPharmacy.updated_at
        ]
      );

      console.log('✅ Pharmacy created successfully:', newPharmacy.id);
      res.status(201).json({
        success: true,
        data: newPharmacy,
        message: 'Pharmacy created successfully!'
      });
    } catch (error) {
      console.error('❌ Error creating pharmacy:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create pharmacy: ' + (error instanceof Error ? error.message : 'Unknown error')
      });
    }
  };

  updatePharmacy = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, location, address, phone_number, email, is_active } = req.body;
      
      console.log(`🔄 Updating pharmacy: ${id}`);

      const result = await this.run(
        `UPDATE pharmacies 
         SET name = COALESCE(?, name), 
             location = COALESCE(?, location), 
             address = COALESCE(?, address), 
             phone_number = COALESCE(?, phone_number), 
             email = COALESCE(?, email), 
             is_active = COALESCE(?, is_active),
             updated_at = ?
         WHERE id = ?`,
        [name, location, address, phone_number, email, is_active, new Date().toISOString(), id]
      );

      if (result.changes === 0) {
        console.log(`❌ Pharmacy not found: ${id}`);
        res.status(404).json({ success: false, error: 'Pharmacy not found' });
        return;
      }

      console.log(`✅ Pharmacy updated successfully: ${id}`);
      res.json({ success: true, message: 'Pharmacy updated successfully' });
    } catch (error) {
      console.error('❌ Error updating pharmacy:', error);
      res.status(500).json({ success: false, error: 'Failed to update pharmacy' });
    }
  };

  deletePharmacy = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      console.log(`🔄 Deleting pharmacy: ${id}`);

      const currentCount = await this.getActivePharmacyCount();

      if (currentCount <= 1) {
        console.log('❌ Cannot delete the only active pharmacy');
        res.status(400).json({ success: false, error: 'Cannot delete the only active pharmacy' });
        return;
      }

      const result = await this.run(
        'UPDATE pharmacies SET is_active = 0, updated_at = ? WHERE id = ?',
        [new Date().toISOString(), id]
      );

      if (result.changes === 0) {
        console.log(`❌ Pharmacy not found: ${id}`);
        res.status(404).json({ success: false, error: 'Pharmacy not found' });
        return;
      }

      console.log(`✅ Pharmacy deleted successfully: ${id}`);
      res.json({ success: true, message: 'Pharmacy deleted successfully' });
    } catch (error) {
      console.error('❌ Error deleting pharmacy:', error);
      res.status(500).json({ success: false, error: 'Failed to delete pharmacy' });
    }
  };

  getPharmacyCount = async (_: Request, res: Response): Promise<void> => {
    try {
      console.log('🔄 Getting pharmacy count...');
      
      const count = await this.getActivePharmacyCount();
      
      res.json({ 
        success: true,
        data: {
          count,
          max_limit: MAX_PHARMACIES,
          remaining: MAX_PHARMACIES - count 
        }
      });
    } catch (error) {
      console.error('❌ Error counting pharmacies:', error);
      res.status(500).json({ success: false, error: 'Failed to count pharmacies' });
    }
  };
}
