import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import FloorPlan from '../models/FloorPlan.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper function to stream file buffer to Cloudinary
const uploadToCloudinary = (fileBuffer, isSvg) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: 'eventpulse',
      resource_type: 'auto'
    };
    
    // Explicitly set svg format if svg
    if (isSvg) {
      uploadOptions.format = 'svg';
    }

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );
    stream.end(fileBuffer);
  });
};

// GET: Fetch the current active floor plan
router.get('/', async (req, res) => {
  try {
    const activePlan = await FloorPlan.findOne({ isActive: true });
    if (!activePlan) {
      return res.status(200).json({
        message: 'No active floor plan found. Please upload a blueprint.',
        zones: [],
        imageUrl: '',
        fileType: 'raster'
      });
    }
    res.json(activePlan);
  } catch (err) {
    res.status(500).json({ error: 'Server error retrieving floor plan', details: err.message });
  }
});

// POST: Upload blueprint image/svg to Cloudinary and set as active base
router.post('/upload', upload.single('blueprint'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const isSvg = req.file.mimetype === 'image/svg+xml' || req.file.originalname.endsWith('.svg');
    const fileType = isSvg ? 'svg' : 'raster';
    
    // Upload image to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(req.file.buffer, isSvg);
    
    let rawSvgContent = null;
    if (isSvg) {
      // Decode raw SVG text for inline rendering
      rawSvgContent = req.file.buffer.toString('utf8');
      // Clean up XML declaration
      rawSvgContent = rawSvgContent.replace(/<\?xml.*\?>/gi, '').trim();
    }

    // Set all previous plans to inactive
    await FloorPlan.updateMany({}, { isActive: false });

    // Create new active floor plan
    const newFloorPlan = new FloorPlan({
      imageUrl: cloudinaryResult.secure_url,
      fileType,
      rawSvgContent,
      zones: []
    });

    await newFloorPlan.save();
    res.status(201).json(newFloorPlan);
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload floor plan', details: err.message });
  }
});

// PUT: Save/update the zones of the active floor plan
router.put('/zones', async (req, res) => {
  try {
    const { zones } = req.body;
    if (!Array.isArray(zones)) {
      return res.status(400).json({ error: 'Zones must be an array' });
    }

    const activePlan = await FloorPlan.findOne({ isActive: true });
    if (!activePlan) {
      return res.status(404).json({ error: 'No active floor plan found to attach zones to' });
    }

    activePlan.zones = zones;
    await activePlan.save();
    res.json(activePlan);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update zones', details: err.message });
  }
});

export default router;
