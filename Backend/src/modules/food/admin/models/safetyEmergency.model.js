import mongoose from 'mongoose';

const safetyEmergencySchema = new mongoose.Schema(
    {
        userName: { type: String, trim: true, default: '' },
        userEmail: { type: String, trim: true, default: '' },
        userPhone: { type: String, trim: true, default: '' },
        message: { type: String, trim: true, default: '' },
        location: {
            lat: { type: Number, default: null },
            lng: { type: Number, default: null },
            address: { type: String, trim: true, default: '' }
        },
        status: { type: String, enum: ['unread', 'read', 'resolved', 'urgent'], default: 'unread', index: true },
        priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium', index: true }
    },
    { collection: 'food_safety_emergencies', timestamps: true }
);

safetyEmergencySchema.index({ createdAt: -1 });

export const FoodSafetyEmergency = mongoose.model('FoodSafetyEmergency', safetyEmergencySchema);

