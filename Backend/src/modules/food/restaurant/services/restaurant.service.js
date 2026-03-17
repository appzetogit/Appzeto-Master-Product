import { FoodRestaurant } from '../models/restaurant.model.js';
import { uploadImageBuffer } from '../../../../services/cloudinary.service.js';
import { ValidationError } from '../../../../core/auth/errors.js';

export const registerRestaurant = async (payload, files) => {
    const {
        restaurantName,
        ownerName,
        ownerEmail,
        ownerPhone,
        primaryContactNumber,
        addressLine1,
        addressLine2,
        area,
        city,
        landmark,
        cuisines,
        openingTime,
        closingTime,
        openDays,
        panNumber,
        nameOnPan,
        gstRegistered,
        gstNumber,
        gstLegalName,
        gstAddress,
        fssaiNumber,
        fssaiExpiry,
        accountNumber,
        ifscCode,
        accountHolderName,
        accountType
    } = payload;

    if (!ownerPhone) {
        throw new ValidationError('Owner phone is required to register a restaurant');
    }

    const existing = await FoodRestaurant.findOne({ restaurantName, ownerPhone }).lean();
    if (existing) {
        throw new ValidationError('Restaurant with this name and owner phone already exists');
    }

    const images = {};

    if (files?.profileImage?.[0]) {
        images.profileImage = await uploadImageBuffer(files.profileImage[0].buffer, 'food/restaurants/profile');
    }
    if (files?.panImage?.[0]) {
        images.panImage = await uploadImageBuffer(files.panImage[0].buffer, 'food/restaurants/pan');
    }
    if (files?.gstImage?.[0]) {
        images.gstImage = await uploadImageBuffer(files.gstImage[0].buffer, 'food/restaurants/gst');
    }
    if (files?.fssaiImage?.[0]) {
        images.fssaiImage = await uploadImageBuffer(files.fssaiImage[0].buffer, 'food/restaurants/fssai');
    }

    let menuImages = [];
    if (files?.menuImages?.length) {
        menuImages = await Promise.all(
            files.menuImages.map((file) => uploadImageBuffer(file.buffer, 'food/restaurants/menu'))
        );
    }

    const restaurant = await FoodRestaurant.create({
        restaurantName,
        ownerName,
        ownerEmail,
        ownerPhone,
        primaryContactNumber,
        addressLine1,
        addressLine2,
        area,
        city,
        landmark,
        cuisines: cuisines || [],
        openingTime,
        closingTime,
        openDays: openDays || [],
        panNumber,
        nameOnPan,
        gstRegistered,
        gstNumber,
        gstLegalName,
        gstAddress,
        fssaiNumber,
        fssaiExpiry,
        accountNumber,
        ifscCode,
        accountHolderName,
        accountType,
        menuImages,
        ...images
    });

    return restaurant.toObject();
};

export const listApprovedRestaurants = async (query = {}) => {
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 100, 1), 1000);
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const skip = (page - 1) * limit;

    const filter = { status: 'approved' };
    if (query.city && String(query.city).trim()) {
        filter.city = { $regex: String(query.city).trim(), $options: 'i' };
    }
    if (query.search && String(query.search).trim()) {
        const term = String(query.search).trim();
        filter.$or = [
            { restaurantName: { $regex: term, $options: 'i' } },
            { area: { $regex: term, $options: 'i' } },
            { city: { $regex: term, $options: 'i' } },
            { cuisines: { $in: [new RegExp(term, 'i')] } }
        ];
    }

    const [restaurants, total] = await Promise.all([
        FoodRestaurant.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        FoodRestaurant.countDocuments(filter)
    ]);

    return { restaurants, total, page, limit };
};

export const getApprovedRestaurantByIdOrSlug = async (idOrSlug) => {
    const value = String(idOrSlug || '').trim();
    if (!value) return null;

    // ObjectId path
    if (/^[0-9a-fA-F]{24}$/.test(value)) {
        return FoodRestaurant.findOne({ _id: value, status: 'approved' }).lean();
    }

    // Slug path: "my-restaurant" -> "my restaurant" (case-insensitive exact match)
    const name = value.replace(/-/g, ' ').trim();
    return FoodRestaurant.findOne({
        status: 'approved',
        restaurantName: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
    }).lean();
};

