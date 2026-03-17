import mongoose from 'mongoose';

const userFeedbackSchema = new mongoose.Schema(
    {
        // Who submitted (optional – UI can still show anonymous)
        customer: {
            name: { type: String, trim: true, default: '' },
            email: { type: String, trim: true, default: '' }
        },
        phone: { type: String, trim: true, default: '' },

        // What feedback is about
        orderId: { type: String, trim: true, default: '' },
        restaurantName: { type: String, trim: true, default: '' },
        deliveryPartner: {
            id: { type: String, trim: true, default: '' },
            name: { type: String, trim: true, default: '' }
        },
        items: {
            type: [{ name: { type: String, trim: true, default: '' } }],
            default: []
        },

        rating: { type: Number, min: 1, max: 5, required: true },
        comment: { type: String, trim: true, default: '' },

        // For list filters/sorting
        submittedAt: { type: Date, default: Date.now, index: true }
    },
    { collection: 'food_user_feedback', timestamps: true }
);

userFeedbackSchema.index({ submittedAt: -1 });
userFeedbackSchema.index({ rating: 1, submittedAt: -1 });

export const FoodUserFeedback = mongoose.model('FoodUserFeedback', userFeedbackSchema);

