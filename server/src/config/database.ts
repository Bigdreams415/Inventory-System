import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

// Project direcoty 
const dbPath = path.join(process.cwd(), 'database.sqlite');

// Ensure the database file exists  
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const initializeDatabase = (): Promise<sqlite3.Database> => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
      } else {
        console.log('Connected to SQLite database at:', dbPath);
        
        // Enable foreign keys and better performance settings
        db.serialize(() => {
          db.run('PRAGMA foreign_keys = ON');
          db.run('PRAGMA journal_mode = WAL');
          db.run('PRAGMA synchronous = NORMAL');
        });

        createTables(db).then(() => resolve(db)).catch(reject);
      }
    });
  });
};

// createTables function 
const createTables = (db: sqlite3.Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    const productsTable = `
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        buy_price REAL NOT NULL CHECK (buy_price >= 0),
        sell_price REAL NOT NULL CHECK (sell_price >= 0),
        stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
        category TEXT NOT NULL,
        description TEXT,
        barcode TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const salesTable = `
      CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY,
        total_amount REAL NOT NULL CHECK (total_amount >= 0),
        total_profit REAL NOT NULL CHECK (total_profit >= 0),
        payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer')),
        status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'refunded')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const saleItemsTable = `
      CREATE TABLE IF NOT EXISTS sale_items (
        id TEXT PRIMARY KEY,
        sale_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        unit_sell_price REAL NOT NULL CHECK (unit_sell_price >= 0),
        unit_buy_price REAL NOT NULL CHECK (unit_buy_price >= 0),
        total_sell_price REAL NOT NULL CHECK (total_sell_price >= 0),
        item_profit REAL NOT NULL CHECK (item_profit >= 0),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT
      )
    `;

    const customersTable = `
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        email TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)',
      'CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)',
      'CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)',
      'CREATE INDEX IF NOT EXISTS idx_products_buy_price ON products(buy_price)',
      'CREATE INDEX IF NOT EXISTS idx_products_sell_price ON products(sell_price)',
      'CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales(payment_method)',
      'CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id)',
      'CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id)',
      'CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)'
    ];

    const tables = [productsTable, salesTable, saleItemsTable, customersTable, ...indexes];
    let completed = 0;
    let hasError = false;

    const runNext = () => {
      if (hasError || completed >= tables.length) {
        if (hasError) {
          reject(new Error('Failed to create database tables'));
        } else {
          console.log('All database tables and indexes created successfully');
          resolve();
        }
        return;
      }

      const sql = tables[completed];
      db.run(sql, (err) => {
        if (err) {
          console.error('Error executing SQL:', sql, err);
          hasError = true;
          reject(err);
        } else {
          completed++;
          runNext();
        }
      });
    };

    runNext();
  });
};

export { dbPath };