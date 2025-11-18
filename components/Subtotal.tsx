"use client";

import React from "react";
import { useStateValue } from "@/context/StateProvider";

const Subtotal: React.FC = () => {
  const [{ basket }] = useStateValue() as any;
  const total = Array.isArray(basket)
    ? basket.reduce(
        (sum: number, item: any) => sum + Number(item.price || 0),
        0
      )
    : 0;

  return (
    <div className="card shadow-sm p-3">
      <h6 className="fw-bold text-success">Subtotal</h6>
      <h4 className="fw-bold mb-3">₹{total.toFixed(2)}</h4>
      <button className="btn btn-success w-100">
        Proceed to Checkout
      </button>
    </div>
  );
};

export default Subtotal;
