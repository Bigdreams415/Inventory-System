import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Get user data directory - SAFE location that persists across updates
const getUserDataPath = () => {
  if (process.env.NODE_ENV === 'development') {
    // In development, use project directory
    return path.join(process.cwd(), 'database.sqlite');
  } else {
    // In production, use user data directory
    const appName = 'Solomon-Medical-POS';
    
    if (process.platform === 'win32') {
      // Windows: C:\Users\Username\AppData\Roaming\Solomon-Medical-POS
      return path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), appName, 'database.sqlite');
    } else if (process.platform === 'darwin') {
      // macOS: /Users/Username/Library/Application Support/Solomon-Medical-POS
      return path.join(os.homedir(), 'Library', 'Application Support', appName, 'database.sqlite');
    } else {
      // Linux: /home/username/.config/Solomon-Medical-POS
      return path.join(os.homedir(), '.config', appName, 'database.sqlite');
    }
  }
};

const dbPath = getUserDataPath();

// Ensure the database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('📁 Created database directory:', dbDir);
}

console.log('📍 Database path:', dbPath);

export const initializeDatabase = (): Promise<sqlite3.Database> => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }

      console.log('Connected to SQLite database at:', dbPath);
      
      // Enable foreign keys and better performance settings
      db.serialize(() => {
        db.run('PRAGMA foreign_keys = ON');
        db.run('PRAGMA journal_mode = WAL');
        db.run('PRAGMA synchronous = NORMAL');
      });

      createTables(db)
        .then(() => createDefaultPharmacy(db))
        .then(() => resolve(db))
        .catch(reject);
    });
  });
};

const createTables = (db: sqlite3.Database): Promise<void> => {
  const tableDefinitions = [
    // PHARMACIES TABLE
    `CREATE TABLE IF NOT EXISTS pharmacies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      address TEXT,
      phone_number TEXT,
      email TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // PRODUCTS TABLE
    `CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      pharmacy_id TEXT NOT NULL,
      name TEXT NOT NULL,
      buy_price REAL NOT NULL CHECK (buy_price >= 0),
      sell_price REAL NOT NULL CHECK (sell_price >= 0),
      stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
      category TEXT NOT NULL,
      description TEXT,
      barcode TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pharmacy_id) REFERENCES pharmacies (id) ON DELETE CASCADE,
      UNIQUE(pharmacy_id, barcode)
    )`,

    // SALES TABLE
    `CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      pharmacy_id TEXT NOT NULL,
      total_amount REAL NOT NULL CHECK (total_amount >= 0),
      total_profit REAL NOT NULL CHECK (total_profit >= 0),
      payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer')),
      status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'refunded')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pharmacy_id) REFERENCES pharmacies (id) ON DELETE CASCADE
    )`,

    // SALE ITEMS TABLE
    `CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY,
      pharmacy_id TEXT NOT NULL,
      sale_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      unit_sell_price REAL NOT NULL CHECK (unit_sell_price >= 0),
      unit_buy_price REAL NOT NULL CHECK (unit_buy_price >= 0),
      total_sell_price REAL NOT NULL CHECK (total_sell_price >= 0),
      item_profit REAL NOT NULL CHECK (item_profit >= 0),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pharmacy_id) REFERENCES pharmacies (id) ON DELETE CASCADE,
      FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT
    )`,

    // CUSTOMERS TABLE
    `CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      pharmacy_id TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pharmacy_id) REFERENCES pharmacies (id) ON DELETE CASCADE,
      UNIQUE(pharmacy_id, phone)
    )`,

    // SERVICES TABLE
    `CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      pharmacy_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL CHECK (price >= 0),
      duration INTEGER NOT NULL CHECK (duration > 0),
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pharmacy_id) REFERENCES pharmacies (id) ON DELETE CASCADE
    )`,

    // SERVICE SALES TABLE
    `CREATE TABLE IF NOT EXISTS service_sales (
      id TEXT PRIMARY KEY,
      pharmacy_id TEXT NOT NULL,
      service_id TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      unit_price REAL NOT NULL CHECK (unit_price >= 0),
      total_amount REAL NOT NULL CHECK (total_amount >= 0),
      served_by TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pharmacy_id) REFERENCES pharmacies (id) ON DELETE CASCADE,
      FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE RESTRICT
    )`
  ];

  const indexDefinitions = [
    // Pharmacy indexes
    'CREATE INDEX IF NOT EXISTS idx_pharmacies_name ON pharmacies(name)',
    'CREATE INDEX IF NOT EXISTS idx_pharmacies_location ON pharmacies(location)',
    'CREATE INDEX IF NOT EXISTS idx_pharmacies_is_active ON pharmacies(is_active)',
    
    // Product indexes
    'CREATE INDEX IF NOT EXISTS idx_products_pharmacy_id ON products(pharmacy_id)',
    'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)',
    'CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)',
    'CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)',
    'CREATE INDEX IF NOT EXISTS idx_products_pharmacy_category ON products(pharmacy_id, category)',
    'CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock)',
    
    // Sales indexes
    'CREATE INDEX IF NOT EXISTS idx_sales_pharmacy_id ON sales(pharmacy_id)',
    'CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_sales_pharmacy_created_at ON sales(pharmacy_id, created_at)',
    'CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales(payment_method)',
    'CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status)',
    
    // Sale items indexes
    'CREATE INDEX IF NOT EXISTS idx_sale_items_pharmacy_id ON sale_items(pharmacy_id)',
    'CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id)',
    'CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id)',
    'CREATE INDEX IF NOT EXISTS idx_sale_items_pharmacy_sale ON sale_items(pharmacy_id, sale_id)',
    
    // Customer indexes
    'CREATE INDEX IF NOT EXISTS idx_customers_pharmacy_id ON customers(pharmacy_id)',
    'CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)',
    'CREATE INDEX IF NOT EXISTS idx_customers_pharmacy_phone ON customers(pharmacy_id, phone)',
    
    // Service indexes
    'CREATE INDEX IF NOT EXISTS idx_services_pharmacy_id ON services(pharmacy_id)',
    'CREATE INDEX IF NOT EXISTS idx_services_category ON services(category)',
    'CREATE INDEX IF NOT EXISTS idx_services_name ON services(name)',
    'CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active)',
    'CREATE INDEX IF NOT EXISTS idx_services_pharmacy_category ON services(pharmacy_id, category)',
    'CREATE INDEX IF NOT EXISTS idx_services_price ON services(price)',
    
    // Service sales indexes
    'CREATE INDEX IF NOT EXISTS idx_service_sales_pharmacy_id ON service_sales(pharmacy_id)',
    'CREATE INDEX IF NOT EXISTS idx_service_sales_service_id ON service_sales(service_id)',
    'CREATE INDEX IF NOT EXISTS idx_service_sales_created_at ON service_sales(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_service_sales_pharmacy_created_at ON service_sales(pharmacy_id, created_at)',
    'CREATE INDEX IF NOT EXISTS idx_service_sales_served_by ON service_sales(served_by)'
  ];

  return executeSQLStatements(db, [...tableDefinitions, ...indexDefinitions]);
};

const executeSQLStatements = (db: sqlite3.Database, statements: string[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    let completed = 0;

    const runNext = () => {
      if (completed >= statements.length) {
        console.log('✅ All database tables and indexes created successfully');
        resolve();
        return;
      }

      db.run(statements[completed], (err) => {
        if (err) {
          console.error('Error executing SQL:', statements[completed], err);
          reject(err);
          return;
        }
        completed++;
        runNext();
      });
    };

    runNext();
  });
};

const createDefaultPharmacy = (db: sqlite3.Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    const defaultPharmacy = {
      id: 'pharmacy_main',
      name: 'Solomon Medicals & Stores',
      location: 'Primary Location',
      address: 'Primary Address',
      phone_number: '',
      email: 'solomonmedicals6715@gmail.com'
    };

    db.run(
      `INSERT OR IGNORE INTO pharmacies (id, name, location, address, phone_number, email, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [
        defaultPharmacy.id,
        defaultPharmacy.name,
        defaultPharmacy.location,
        defaultPharmacy.address,
        defaultPharmacy.phone_number,
        defaultPharmacy.email
      ],
      function(err) {
        if (err) {
          console.error('Error creating default pharmacy:', err);
          reject(err);
          return;
        }

        if (this.changes > 0) {
          console.log('✅ Default pharmacy created successfully');
          console.log('🏪 Pharmacy Name:', defaultPharmacy.name);
          console.log('📍 Users can create 4 more pharmacies (5 total limit)');
        } else {
          console.log('📝 Default pharmacy already exists');
        }
        resolve();
      }
    );
  });
};

export { dbPath };