const express = require('express');
const catalogUpdateJob = require('../../jobs/catalogUpdateJob');

const router = express.Router();

/**
 * Manually trigger catalog update
 */
router.post('/admin/trigger-update', async (req, res) => {
  try {
    const result = await catalogUpdateJob.triggerManual();
    
    res.json({
      success: true,
      message: 'Catalog update triggered',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Also add GET version (cron-job.org uses GET by default)
router.get('/admin/trigger-update', async (req, res) => {
  try {
    const result = await catalogUpdateJob.triggerManual();
    
    res.json({
      success: true,
      message: 'Catalog update triggered',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;