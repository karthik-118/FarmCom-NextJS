import mongoose, { Schema, Document } from "mongoose";

export interface IOrder extends Document {
  customerId: string;
  customerName: string;
  customerEmail: string;
  products: Array<{
    productId: string;
    sellerId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  shippingDetails: {
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  paymentMethod: string;
  status: string;
  createdAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    customerId: { type: String, required: true },
    customerName: { type: String },
    customerEmail: { type: String },
    products: [
      {
        productId: { type: String, required: true },
        sellerId: { type: String, required: true },
        name: { type: String },
        price: { type: Number },
        quantity: { type: Number, default: 1 },
      },
    ],
    totalAmount: { type: Number, required: true },
    shippingDetails: {
      address: String,
      city: String,
      state: String,
      pincode: String,
    },
    paymentMethod: { type: String, default: "COD" },
    status: { type: String, default: "Pending" },
  },
  { timestamps: true }
);

// ⭐ FIX — THIS LINE IS THE IMPORTANT PART
const Order =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
