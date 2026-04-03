import mongoose from "mongoose";
import { SellerCategory } from "../models/sellerCategory.model.js";
import { SellerNotification } from "../models/sellerNotification.model.js";

const DEFAULT_CATEGORY_TREE = [
  {
    name: "Catalog",
    slug: "catalog",
    children: [
      {
        name: "Groceries",
        slug: "groceries",
        children: [
          { name: "Staples", slug: "staples" },
          { name: "Dairy & Breakfast", slug: "dairy-breakfast" },
          { name: "Snacks", slug: "snacks" },
        ],
      },
      {
        name: "Fresh",
        slug: "fresh",
        children: [
          { name: "Fruits", slug: "fruits" },
          { name: "Vegetables", slug: "vegetables" },
          { name: "Herbs", slug: "herbs" },
        ],
      },
      {
        name: "Beverages",
        slug: "beverages",
        children: [
          { name: "Soft Drinks", slug: "soft-drinks" },
          { name: "Tea & Coffee", slug: "tea-coffee" },
          { name: "Juices", slug: "juices" },
        ],
      },
      {
        name: "Home Essentials",
        slug: "home-essentials",
        children: [
          { name: "Cleaning", slug: "cleaning" },
          { name: "Laundry", slug: "laundry" },
          { name: "Kitchen Care", slug: "kitchen-care" },
        ],
      },
      {
        name: "Personal Care",
        slug: "personal-care",
        children: [
          { name: "Skin Care", slug: "skin-care" },
          { name: "Hair Care", slug: "hair-care" },
          { name: "Daily Hygiene", slug: "daily-hygiene" },
        ],
      },
    ],
  },
];

const categoryNode = (doc) => ({
  _id: doc._id,
  id: doc._id,
  name: doc.name,
  slug: doc.slug,
  children: [],
});

const toObjectId = (value) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
};

const walkSeed = async (nodes, parentId = null, depth = 0, parentKey = "") => {
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    const key = [parentKey, node.slug].filter(Boolean).join("/");
    const doc = await SellerCategory.findOneAndUpdate(
      { key },
      {
        $setOnInsert: {
          name: node.name,
          slug: node.slug,
          key,
          parentId,
          depth,
          sortOrder: index,
          isActive: true,
        },
      },
      { upsert: true, new: true },
    );

    if (Array.isArray(node.children) && node.children.length) {
      await walkSeed(node.children, doc._id, depth + 1, key);
    }
  }
};

export const ensureSellerCategoriesSeeded = async () => {
  const existingCount = await SellerCategory.countDocuments();
  if (existingCount > 0) return;
  await walkSeed(DEFAULT_CATEGORY_TREE);
};

export const buildSellerCategoryTree = async () => {
  await ensureSellerCategoriesSeeded();
  const docs = await SellerCategory.find({ isActive: true })
    .sort({ depth: 1, sortOrder: 1, name: 1 })
    .lean();

  const lookup = new Map();
  const roots = [];

  docs.forEach((doc) => {
    lookup.set(String(doc._id), categoryNode(doc));
  });

  docs.forEach((doc) => {
    const current = lookup.get(String(doc._id));
    if (doc.parentId && lookup.has(String(doc.parentId))) {
      lookup.get(String(doc.parentId)).children.push(current);
    } else {
      roots.push(current);
    }
  });

  return roots;
};

export const getDefaultSellerCategoryPath = async () => {
  await ensureSellerCategoriesSeeded();
  const header = await SellerCategory.findOne({ depth: 0, isActive: true })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();
  if (!header) return null;

  const category = await SellerCategory.findOne({
    parentId: header._id,
    depth: 1,
    isActive: true,
  })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();

  const subcategory = category
    ? await SellerCategory.findOne({
        parentId: category._id,
        depth: 2,
        isActive: true,
      })
        .sort({ sortOrder: 1, createdAt: 1 })
        .lean()
    : null;

  return {
    headerId: header?._id || null,
    categoryId: category?._id || null,
    subcategoryId: subcategory?._id || category?._id || header?._id || null,
  };
};

export const resolveSellerCategoryIds = async ({
  headerId,
  categoryId,
  subcategoryId,
}) => {
  await ensureSellerCategoriesSeeded();
  const selectedIds = [headerId, categoryId, subcategoryId]
    .map((value) => toObjectId(value))
    .filter(Boolean);

  if (selectedIds.length === 3) {
    const docs = await SellerCategory.find({ _id: { $in: selectedIds } }).lean();
    const byId = new Map(docs.map((doc) => [String(doc._id), doc]));

    const header = byId.get(String(headerId));
    const category = byId.get(String(categoryId));
    const subcategory = byId.get(String(subcategoryId));

    if (
      header &&
      category &&
      subcategory &&
      header.depth === 0 &&
      category.depth === 1 &&
      subcategory.depth === 2 &&
      String(category.parentId) === String(header._id) &&
      String(subcategory.parentId) === String(category._id)
    ) {
      return {
        headerId: header._id,
        categoryId: category._id,
        subcategoryId: subcategory._id,
      };
    }
  }

  return getDefaultSellerCategoryPath();
};

const notificationPayloadForProduct = (product) => {
  if (!product || typeof product.stock !== "number") return null;

  if (product.stock <= 0) {
    return {
      key: `inventory:${product._id}:out`,
      type: "inventory",
      title: `Out of stock: ${product.name}`,
      message: `${product.name} is unavailable until you restock it.`,
      metadata: { productId: String(product._id), stock: product.stock },
    };
  }

  if (product.stock <= Number(product.lowStockAlert || 5)) {
    return {
      key: `inventory:${product._id}:low`,
      type: "inventory",
      title: `Low stock: ${product.name}`,
      message: `Only ${product.stock} unit(s) are left for ${product.name}.`,
      metadata: { productId: String(product._id), stock: product.stock },
    };
  }

  return null;
};

export const syncSellerInventoryNotification = async (sellerId, product) => {
  if (!sellerId || !product?._id) return;

  const staleKeys = [
    `inventory:${product._id}:low`,
    `inventory:${product._id}:out`,
  ];

  const nextNotification = notificationPayloadForProduct(product);

  if (!nextNotification) {
    await SellerNotification.deleteMany({
      sellerId,
      key: { $in: staleKeys },
    });
    return;
  }

  await SellerNotification.deleteMany({
    sellerId,
    key: { $in: staleKeys.filter((key) => key !== nextNotification.key) },
  });

  await SellerNotification.findOneAndUpdate(
    { sellerId, key: nextNotification.key },
    {
      $set: {
        type: nextNotification.type,
        title: nextNotification.title,
        message: nextNotification.message,
        metadata: nextNotification.metadata,
      },
      $setOnInsert: { isRead: false },
    },
    { upsert: true, new: true },
  );
};
