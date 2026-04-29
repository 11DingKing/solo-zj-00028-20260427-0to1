import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth.js";
import {
  Product,
  ProductCategories,
  ProductStatuses,
} from "../models/Product.js";
import { User } from "../models/User.js";
import {
  createProductSchema,
  updateProductSchema,
  productListSchema,
} from "../utils/validation.js";
import redis from "../db/redis.js";
import mongoose from "../db/mongo.js";

const products = new Hono();

products.get("/hot", async (c) => {
  try {
    const cacheKey = "hot_products";
    const cached = await redis.get(cacheKey);

    if (cached) {
      return c.json(JSON.parse(cached));
    }

    const hotProducts = await Product.find({ status: "在售" })
      .sort({ viewCount: -1 })
      .limit(20)
      .populate({
        path: "sellerId",
        select: "nickname avatar creditScore",
        model: User,
      });

    await redis.set(cacheKey, JSON.stringify(hotProducts), "EX", 300);

    return c.json(hotProducts);
  } catch (error) {
    console.error("获取热门商品错误:", error);
    return c.json({ error: "获取热门商品失败" }, 500);
  }
});

products.get("/categories", async (c) => {
  try {
    const cacheKey = "category_stats";
    const cached = await redis.get(cacheKey);

    if (cached) {
      return c.json(JSON.parse(cached));
    }

    const stats = await Product.aggregate([
      { $match: { status: "在售" } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    const result = ProductCategories.map((cat) => ({
      category: cat,
      count: stats.find((s: any) => s._id === cat)?.count || 0,
    }));

    await redis.set(cacheKey, JSON.stringify(result), "EX", 300);

    return c.json(result);
  } catch (error) {
    console.error("获取分类统计错误:", error);
    return c.json({ error: "获取分类统计失败" }, 500);
  }
});

products.get("/", optionalAuthMiddleware, async (c) => {
  try {
    const query = c.req.query();
    const validated = productListSchema.parse(query);

    const filter: any = { status: "在售" };

    if (validated.category) {
      filter.category = validated.category;
    }

    if (validated.minPrice !== undefined || validated.maxPrice !== undefined) {
      filter.price = {};
      if (validated.minPrice !== undefined) {
        filter.price.$gte = validated.minPrice;
      }
      if (validated.maxPrice !== undefined) {
        filter.price.$lte = validated.maxPrice;
      }
    }

    if (validated.condition) {
      filter.condition = validated.condition;
    }

    if (validated.transactionMethod) {
      filter.transactionMethod = validated.transactionMethod;
    }

    if (validated.keyword) {
      filter.$or = [
        { title: { $regex: validated.keyword, $options: "i" } },
        { description: { $regex: validated.keyword, $options: "i" } },
      ];
    }

    const sort: any = {};
    switch (validated.sortBy) {
      case "price_asc":
        sort.price = 1;
        break;
      case "price_desc":
        sort.price = -1;
        break;
      case "created_at":
      default:
        sort.createdAt = -1;
        break;
    }

    const skip = (validated.page - 1) * validated.limit;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(validated.limit)
        .populate({
          path: "sellerId",
          select: "nickname avatar creditScore",
          model: User,
        }),
      Product.countDocuments(filter),
    ]);

    const userId = c.get("userId") as mongoose.Types.ObjectId | undefined;

    const items = products.map((p) => ({
      ...p.toObject(),
      isFavorite: false,
    }));

    return c.json({
      items,
      total,
      page: validated.page,
      limit: validated.limit,
      totalPages: Math.ceil(total / validated.limit),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "参数验证失败", details: error.errors }, 400);
    }
    console.error("获取商品列表错误:", error);
    return c.json({ error: "获取商品列表失败" }, 500);
  }
});

products.get("/my", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId") as mongoose.Types.ObjectId;
    const { page = "1", limit = "100" } = c.req.query();

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 100;
    const skip = (pageNum - 1) * limitNum;

    const [myProducts, total] = await Promise.all([
      Product.find({ sellerId: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate({
          path: "sellerId",
          select: "nickname avatar creditScore",
          model: User,
        }),
      Product.countDocuments({ sellerId: userId }),
    ]);

    return c.json({
      items: myProducts,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error("获取我的商品错误:", error);
    return c.json({ error: "获取我的商品失败" }, 500);
  }
});

products.get("/:id", optionalAuthMiddleware, async (c) => {
  try {
    const id = c.req.param("id");

    const product = await Product.findById(id).populate({
      path: "sellerId",
      select: "nickname avatar creditScore",
      model: User,
    });

    if (!product) {
      return c.json({ error: "商品不存在" }, 404);
    }

    if (product.status === "在售") {
      product.viewCount += 1;
      await product.save();

      await redis.del("hot_products");
    }

    return c.json(product);
  } catch (error) {
    console.error("获取商品详情错误:", error);
    return c.json({ error: "获取商品详情失败" }, 500);
  }
});

products.post("/", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId") as mongoose.Types.ObjectId;
    const body = await c.req.json();
    const validated = createProductSchema.parse(body);

    const product = new Product({
      ...validated,
      sellerId: userId,
      images: [],
    });

    await product.save();

    await redis.del("hot_products");
    await redis.del("category_stats");

    const populated = await product.populate({
      path: "sellerId",
      select: "nickname avatar creditScore",
      model: User,
    });

    return c.json(populated, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "参数验证失败", details: error.errors }, 400);
    }
    console.error("创建商品错误:", error);
    return c.json({ error: "创建商品失败" }, 500);
  }
});

products.put("/:id", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId") as mongoose.Types.ObjectId;
    const id = c.req.param("id");
    const body = await c.req.json();
    const validated = updateProductSchema.parse(body);

    const product = await Product.findOne({
      _id: id,
      sellerId: userId,
    });

    if (!product) {
      return c.json({ error: "商品不存在或无权限修改" }, 404);
    }

    Object.assign(product, validated);
    await product.save();

    await redis.del("hot_products");
    await redis.del("category_stats");

    const populated = await product.populate({
      path: "sellerId",
      select: "nickname avatar creditScore",
      model: User,
    });

    return c.json(populated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "参数验证失败", details: error.errors }, 400);
    }
    console.error("更新商品错误:", error);
    return c.json({ error: "更新商品失败" }, 500);
  }
});

products.delete("/:id", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId") as mongoose.Types.ObjectId;
    const id = c.req.param("id");

    const product = await Product.findOneAndDelete({
      _id: id,
      sellerId: userId,
    });

    if (!product) {
      return c.json({ error: "商品不存在或无权限删除" }, 404);
    }

    await redis.del("hot_products");
    await redis.del("category_stats");

    return c.json({ message: "删除成功" });
  } catch (error) {
    console.error("删除商品错误:", error);
    return c.json({ error: "删除商品失败" }, 500);
  }
});

export default products;
