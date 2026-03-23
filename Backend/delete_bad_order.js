import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const mongodbUri = process.env.MONGODB_URI;
const orderId = '69ba8af80bb25e28ffa13811';

async function deleteOrder() {
    if (!mongodbUri) {
        console.error('MONGODB_URI not found in .env');
        process.exit(1);
    }

    try {
        await mongoose.connect(mongodbUri);
        console.log('Connected to MongoDB');

        // We can use mongoose.connection.db.collection to delete even if model is not loaded
        // or we can import the model. Let's try to find the collection name.
        // Usually it's 'orders'
        const collections = await mongoose.connection.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        console.log('Collections:', collectionNames);

        let totalDeleted = 0;
        for (const collectionName of collectionNames) {
            const collection = mongoose.connection.db.collection(collectionName);
            
            // Search for documents where any field contains the string (simplified: check _id and orderId common fields)
            const idObj = orderId.length === 24 ? new mongoose.Types.ObjectId(orderId) : null;
            
            const query = {
                $or: [
                    { _id: orderId },
                    ...(idObj ? [{ _id: idObj }] : []),
                    { orderId: orderId },
                    { id: orderId }
                ]
            };

            const result = await collection.deleteMany(query);

            if (result.deletedCount > 0) {
                console.log(`Successfully deleted ${result.deletedCount} document(s) from ${collectionName}`);
                totalDeleted += result.deletedCount;
            }
        }

        if (totalDeleted === 0) {
            console.log(`${orderId} not found in any collection`);
        } else {
            console.log(`Deleted ${orderId} from ${totalDeleted} collection(s)`);
        }

    } catch (error) {
        console.error('Error deleting order:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

deleteOrder();
