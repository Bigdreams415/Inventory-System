import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { dbService } from './models/database';

// Import routes
import productRoutes from './routes/products';
import saleRoutes from './routes/sales';
import dashboardRoutes from './routes/dashboard';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/dashboard', dashboardRoutes);

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

// Start server
async function startServer() {
  try {
    // Connect to database
    await dbService.connect();
    console.log('Database connected successfully');

    // Start Express server
    app.listen(PORT, () => {
      console.log(`POS Server running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
      console.log(`API Base: http://localhost:${PORT}/api`);
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