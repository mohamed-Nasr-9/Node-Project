// models/ProcessedStripeEvent.js
import mongoose from 'mongoose';

const processedStripeEventSchema = new mongoose.Schema({
  eventId: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  processedAt: { 
    type: Date, 
    default: Date.now,
    expires: 60 * 60 * 24 * 7 // ✅ Auto-delete after 7 days (TTL index)
  }
});

export default mongoose.model('ProcessedStripeEvent', processedStripeEventSchema);