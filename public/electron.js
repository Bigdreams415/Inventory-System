const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { initializeDatabase, productService } = require('../src/services/database');

let db;
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadURL(
    isDev 
      ? 'http://localhost:3000' 
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

// Initialize database when app is ready
app.whenReady().then(async () => {
  try {
    db = await initializeDatabase();
    createWindow();
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
});

// IPC handlers for product operations
ipcMain.handle('get-products', async () => {
  try {
    return await productService.getAllProducts(db);
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
});

ipcMain.handle('create-product', async (event, product) => {
  try {
    return await productService.createProduct(db, product);
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
});

ipcMain.handle('update-product', async (event, product) => {
  try {
    return await productService.updateProduct(db, product);
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
});

ipcMain.handle('delete-product', async (event, id) => {
  try {
    return await productService.deleteProduct(db, id);
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
});

ipcMain.handle('search-products', async (event, searchTerm) => {
  try {
    return await productService.searchProducts(db, searchTerm);
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
});

app.on('window-all-closed', () => {
  if (db) {
    db.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
