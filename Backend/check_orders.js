import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const orderSchema = new mongoose.Schema({
    orderId: String,
    restaurantId: mongoose.Schema.Types.ObjectId,
    orderStatus: String,
    dispatch: {
        status: String,
        deliveryPartnerId: mongoose.Schema.Types.ObjectId
    }
}, { collection: 'food_orders' });

const restaurantSchema = new mongoose.Schema({
    restaurantName: String,
    location: {
        type: { type: String, enum: ['Point'] },
        coordinates: [Number]
    }
}, { collection: 'food_restaurants' });

const FoodOrder = mongoose.model('FoodOrder', orderSchema);
const FoodRestaurant = mongoose.model('FoodRestaurant', restaurantSchema);

async function run() {
    await mongoose.connect(MONGODB_URI);
    
    const recentOrders = await FoodOrder.find()
        .sort({ createdAt: -1 })
        .limit(5);

    console.log(`Checking ${recentOrders.length} recent orders:`);
    for (const order of recentOrders) {
        const restaurant = await FoodRestaurant.findById(order.restaurantId);
        console.log(`Order ID: ${order.orderId}, Status: ${order.orderStatus}, Restaurant: ${restaurant?.restaurantName}, Rest-Location: ${restaurant?.location?.coordinates}`);
        console.log(`Dispatch Status: ${order.dispatch?.status}, Partner: ${order.dispatch?.deliveryPartnerId}`);
    }

    await mongoose.disconnect();
}

run().catch(console.error);
