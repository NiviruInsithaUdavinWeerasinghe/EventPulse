import mongoose from 'mongoose';

const zoneSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  center: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  points: { type: String } // String of points for drawing fallback (manual mode)
});

const floorPlanSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  fileType: { type: String, enum: ['svg', 'raster'], required: true },
  rawSvgContent: { type: String }, // Stores raw XML of SVG files for inline embedding
  zones: [zoneSchema],
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

export default mongoose.model('FloorPlan', floorPlanSchema);
