import { Router } from 'express';
import { syncService } from '../services/syncService';

const router = Router();

// GET /api/sync/status - Get sync status
router.get('/status', (req, res) => {
  try {
    const status = syncService.getSyncState();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get sync status'
    });
  }
});

// POST /api/sync/manual - Trigger manual sync
router.post('/manual', async (req, res) => {
  try {
    const success = await syncService.manualSync();
    const status = syncService.getSyncState();
    
    res.json({
      success,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to trigger sync'
    });
  }
});

// POST /api/sync/start - Start auto sync
router.post('/start', (req, res) => {
  try {
    syncService.startAutoSync();
    res.json({
      success: true,
      message: 'Auto sync started'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to start auto sync'
    });
  }
});

export default router;