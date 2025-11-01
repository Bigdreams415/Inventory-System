import sqlite3 from 'sqlite3';
import path from 'path';
import { app } from 'electron';
import { Product } from '../types';

// Database file path
const isDev = process.env.NODE_ENV === 'development';
const dbPath = isDev 
  ? path.join(__dirname, '../../database.sqlite')
  : path.join(app.getPath('userData'), 'database.sqlite');

// Create and initialize database
export const initializeDatabase = (): Promise<sqlite3.Database> => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
      } else {
        console.log('Connected to SQLite database');
        createTables(db).then(() => resolve(db)).catch(reject);
      }
    });
  });
};

// Create tables
const createTables = (db: sqlite3.Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    const productsTable = `
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        stock INTEGER NOT NULL,
        category TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    db.run(productsTable, (err) => {
      if (err) {
        console.error('Error creating products table:', err);
        reject(err);
      } else {
        console.log('Products table ready');
        resolve();
      }
    });
  });
};

// Product operations
export const productService = {
  // Get all products
  getAllProducts: (db: sqlite3.Database): Promise<Product[]> => {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM products ORDER BY name';
      db.all(query, [], (err, rows: Product[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  },

  // Get product by ID
  getProductById: (db: sqlite3.Database, id: string): Promise<Product> => {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM products WHERE id = ?';
      db.get(query, [id], (err, row: Product) => {
        if (err) {
          reject(err);
        } else if (!row) {
          reject(new Error('Product not found'));
        } else {
          resolve(row);
        }
      });
    });
  },

  // Create new product
  createProduct: (db: sqlite3.Database, product: Omit<Product, 'id'>): Promise<Product> => {
    return new Promise((resolve, reject) => {
      const id = Date.now().toString();
      const query = `
        INSERT INTO products (id, name, price, stock, category) 
        VALUES (?, ?, ?, ?, ?)
      `;
      
      db.run(query, [id, product.name, product.price, product.stock, product.category], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ ...product, id });
        }
      });
    });
  },

  // Update product
  updateProduct: (db: sqlite3.Database, product: Product): Promise<void> => {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE products 
        SET name = ?, price = ?, stock = ?, category = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      
      db.run(query, [product.name, product.price, product.stock, product.category, product.id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  },

  // Delete product
  deleteProduct: (db: sqlite3.Database, id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM products WHERE id = ?';
      db.run(query, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  },

  // Search products
  searchProducts: (db: sqlite3.Database, searchTerm: string): Promise<Product[]> => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM products 
        WHERE name LIKE ? OR category LIKE ? 
        ORDER BY name
      `;
      const searchPattern = `%${searchTerm}%`;
      
      db.all(query, [searchPattern, searchPattern], (err, rows: Product[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
};
