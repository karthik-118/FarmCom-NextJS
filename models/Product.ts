import mongoose, { Schema, models } from "mongoose";

const ProductSchema = new Schema(
  {
    name: String,
    description: String,
    category: String,
    price: Number,
    imageUrl: String,
    sellerId: String,
    ratingCount: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default models.Product || mongoose.model("Product", ProductSchema);
