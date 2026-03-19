import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env from Backend/.env
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

// Define schema inline to avoid complex imports
const deliveryPartnerSchema = new mongoose.Schema({
    name: String,
    phone: String,
    status: String,
    availabilityStatus: String,
    lastLat: Number,
    lastLng: Number
}, { collection: 'food_delivery_partners' });

const FoodDeliveryPartner = mongoose.model('FoodDeliveryPartner', deliveryPartnerSchema);

async function run() {
    if (!MONGODB_URI) {
        console.error('MONGODB_URI not found in .env');
        process.exit(1);
    }
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const onlinePartners = await FoodDeliveryPartner.find({
        status: 'approved',
        availabilityStatus: 'online'
    }).select('_id name phone lastLat lastLng');

    console.log(`Found ${onlinePartners.length} online approved partners:`);
    onlinePartners.forEach(p => {
        console.log(`- ${p.name} (${p.phone}): ID=${p._id}, Location=${p.lastLat},${p.lastLng}`);
    });

    await mongoose.disconnect();
}

run().catch(console.error);
