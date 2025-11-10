// server/src/index.ts

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { dbService } from './models/database';
import { createPharmacyRoutes } from './routes/pharmacyRoutes'; 
import { PharmacyMiddleware } from './middleware/pharmacyMiddleware';

// Import routes
import productRoutes from './routes/products';
import saleRoutes from './routes/sales';
import dashboardRoutes from './routes/dashboard';
import servicesRoutes from './routes/services'; // NEW
import serviceSalesRoutes from './routes/serviceSales'; // NEW
import authRoutes from './routes/auth';
import syncRoutes from './routes/syncRoutes';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply pharmacy middleware to ALL API routes (must come before other routes)
app.use('/api', PharmacyMiddleware.setPharmacyFromRequest);

// Pharmacy management routes
app.get('/api/pharmacy/current', PharmacyMiddleware.getCurrentPharmacy);
app.post('/api/pharmacy/switch', PharmacyMiddleware.switchPharmacy);
app.get('/api/pharmacy/all', PharmacyMiddleware.getAllPharmacies);

// Start server
async function startServer() {
  try {
    // Connect to database
    await dbService.connect();
    console.log('Database connected successfully');

    // Get the database instance from dbService
    const db = dbService.getDatabase();

    // ✅ MOVE THIS HERE: Initialize pharmacy routes BEFORE starting server
    app.use('/api/pharmacies', createPharmacyRoutes(db));

    // ✅ ALSO register other routes that depend on database
    app.use('/api/products', productRoutes);
    app.use('/api/sales', saleRoutes);
    app.use('/api/dashboard', dashboardRoutes);
    app.use('/api/services', servicesRoutes); // NEW
    app.use('/api/service-sales', serviceSalesRoutes); // NEW
    app.use('/api/auth', authRoutes);
    app.use('/api/sync', syncRoutes);

    // Health check
    app.get('/api/health', (_req, res) => {
      res.json({ 
        success: true, 
        message: 'POS Server is running', 
        timestamp: new Date().toISOString() 
      });
    });

    // API welcome
    app.get('/api', (_req, res) => {
      res.json({
        success: true,
        message: 'POS Inventory System API',
        version: '1.0.0',
        endpoints: {
          products: '/api/products',
          sales: '/api/sales',
          dashboard: '/api/dashboard',
          pharmacies: '/api/pharmacies',
          services: '/api/services', // NEW
          'service-sales': '/api/service-sales', // NEW
          pharmacy: {
            current: '/api/pharmacy/current',
            switch: '/api/pharmacy/switch',
            all: '/api/pharmacy/all'
          },
          health: '/api/health'
        }
      });
    });

    // Root handler
    app.get('/', (_req, res) => {
      res.redirect('/api');
    });

    // 404 handler for all other routes
    app.use((req, res) => {
      if (req.originalUrl.startsWith('/api/')) {
        // API 404
        res.status(404).json({
          success: false,
          error: 'API endpoint not found',
          path: req.originalUrl
        });
      } else {
        // General 404 - redirect to API
        res.redirect('/api');
      }
    });

    // Error handling middleware
    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error('Error:', err);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
      });
    });

    // Start Express server
    app.listen(PORT, () => {
      console.log(`POS Server running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
      console.log(`API Base: http://localhost:${PORT}/api`);
      console.log(`Current pharmacy: http://localhost:${PORT}/api/pharmacy/current`);
      console.log(`All pharmacies: http://localhost:${PORT}/api/pharmacy/all`);
      console.log(`Pharmacy CRUD: http://localhost:${PORT}/api/pharmacies`);
      console.log(`Services: http://localhost:${PORT}/api/services`); // NEW
      console.log(`Service Sales: http://localhost:${PORT}/api/service-sales`); // NEW
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server gracefully...');
  dbService.close()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error during shutdown:', err);
      process.exit(1);
    });
});

process.on('SIGTERM', () => {
  console.log('\nShutting down server gracefully...');
  dbService.close()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error during shutdown:', err);
      process.exit(1);
    });
});

startServer();