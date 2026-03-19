import mongoose from 'mongoose';
import { FoodDeliveryPartner } from '../Backend/src/modules/food/delivery/models/deliveryPartner.model.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('../Backend/.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
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
