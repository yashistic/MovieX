const express = require('express');
const catalogUpdateJob = require('../../jobs/catalogUpdateJob');

const router = express.Router();

/**
 * Trigger catalog update
 * IMPORTANT:
 * - Respond immediately (cron-job.org max timeout = 30s)
 * - Run update in background
 */

// GET → used by cron-job.org
router.get('/admin/trigger-update', (req, res) => {
  // ✅ respond immediately
  res.status(200).json({
    success: true,
    message: 'Catalog update triggered',
    status: 'running'
  });

  // ✅ run job in background
  setImmediate(async () => {
    try {
      console.log('[INFO] UPDATE: Catalog update triggered via GET');
      await catalogUpdateJob.triggerManual();
      console.log('[INFO] UPDATE: Catalog update completed');
    } catch (error) {
      console.error('[ERROR] UPDATE failed:', error);
    }
  });
});

// POST → optional manual/internal trigger
router.post('/admin/trigger-update', (req, res) => {
  // ✅ respond immediately
  res.status(200).json({
    success: true,
    message: 'Catalog update triggered',
    status: 'running'
  });

  // ✅ run job in background
  setImmediate(async () => {
    try {
      console.log('[INFO] UPDATE: Catalog update triggered via POST');
      await catalogUpdateJob.triggerManual();
      console.log('[INFO] UPDATE: Catalog update completed');
    } catch (error) {
      console.error('[ERROR] UPDATE failed:', error);
    }
  });
});

module.exports = router;
