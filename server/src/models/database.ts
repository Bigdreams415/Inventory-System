import sqlite3 from 'sqlite3';
import { initializeDatabase, dbPath } from '../config/database';  

class DatabaseService {
  private static instance: DatabaseService;
  private db: sqlite3.Database | null = null;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async connect(): Promise<sqlite3.Database> {
    if (!this.db) {
      this.db = await initializeDatabase();
    }
    return this.db;
  }

  public getDatabase(): sqlite3.Database {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  public async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            this.db = null;
            console.log('Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  // Utility method for running queries with better error  
  public run(query: string, params: any[] = []): Promise<{ lastID?: number; changes?: number }> {
    return new Promise((resolve, reject) => {
      this.getDatabase().run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            lastID: this.lastID,
            changes: this.changes
          });
        }
      });
    });
  }

  public get<T>(query: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      this.getDatabase().get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row as T);
        }
      });
    });
  }

  public all<T>(query: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.getDatabase().all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as T[]);
        }
      });
    });
  }

  // Transaction support
  public async transaction<T>(callback: (db: sqlite3.Database) => Promise<T>): Promise<T> {
    const db = this.getDatabase();
    
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        callback(db)
          .then((result) => {
            db.run('COMMIT', (err) => {
              if (err) {
                reject(err);
              } else {
                resolve(result);
              }
            });
          })
          .catch((error) => {
            db.run('ROLLBACK', () => {
              reject(error);
            });
          });
      });
    });
  }

  public async getTotalStockWorth(pharmacyId: string): Promise<number> {
    const result = await this.get<{ total_worth: number }>(`
      SELECT COALESCE(SUM(stock * buy_price), 0) as total_worth 
      FROM products 
      WHERE pharmacy_id = ?
    `, [pharmacyId]);
    
    return result?.total_worth || 0;
  }

  // Get database info
  public getDatabaseInfo() {
    return {
      path: dbPath,
      connected: !!this.db
    };
  }
}

export const dbService = DatabaseService.getInstance();