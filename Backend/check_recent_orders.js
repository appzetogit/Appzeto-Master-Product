import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const orders = await mongoose.connection.collection('food_orders')
        .find({ updatedAt: { $gt: new Date(Date.now() - 600000) } })
        .toArray();
    console.log(JSON.stringify(orders));
    process.exit(0);
}
run();
