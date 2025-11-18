"use client";

import React, { useEffect, useState } from "react";

interface Order {
  _id: string;
  status: string;
  total: number;
  address?: {
    line1?: string;
    city?: string;
    [key: string]: any;
  };
  items?: { name: string; quantity: number }[];
  buyerRating?: { value?: number };
  [key: string]: any;
}

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("authToken")
      : null;

  // ✅ Fetch customer orders (Next.js API)
  const fetchOrders = async () => {
    if (!token) return;
    setLoading(true);

    try {
      const res = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch orders");

      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("fetchOrders error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // ⭐ Submit product rating (Next.js API)
  const rateOrder = async (
    id: string,
    value: number,
    comment: string
  ) => {
    if (!token) return;

    const res = await fetch(`/api/orders/${id}/rate`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ value, comment }),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Thanks for rating!");
      fetchOrders();
    } else {
      alert(data.message || "Failed to rate");
    }
  };

  return (
    <div className="container my-4">
      <h3 className="mb-3">My Orders</h3>

      {loading && <p>Loading...</p>}

      {!loading && orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        orders.map((o) => (
          <div key={o._id} className="card mb-3 p-3">
            <div className="d-flex justify-content-between">
              <div>
                <div><strong>Order:</strong> {o._id}</div>
                <div><strong>Status:</strong> {o.status}</div>
                <div><strong>Total:</strong> ₹{o.total}</div>
                <div>
                  <strong>Address:</strong>{" "}
                  {o.address?.line1}, {o.address?.city}
                </div>
              </div>

              {/* ⭐ Rating */}
              <div className="text-end">
                {o.status === "delivered" && !o.buyerRating?.value ? (
                  <div>
                    <select
                      id={`r-${o._id}`}
                      className="form-select form-select-sm mb-2"
                      defaultValue="5"
                    >
                      {[5, 4, 3, 2, 1].map((v) => (
                        <option key={v} value={v}>
                          {v} ★
                        </option>
                      ))}
                    </select>

                    <input
                      id={`c-${o._id}`}
                      className="form-control form-control-sm mb-2"
                      placeholder="Comment (optional)"
                    />

                    <button
                      className="btn btn-success btn-sm"
                      onClick={() =>
                        rateOrder(
                          o._id,
                          Number(
                            (
                              document.getElementById(
                                `r-${o._id}`
                              ) as HTMLSelectElement
                            ).value
                          ),
                          (
                            document.getElementById(
                              `c-${o._id}`
                            ) as HTMLInputElement
                          ).value
                        )
                      }
                    >
                      Submit Rating
                    </button>
                  </div>
                ) : o.buyerRating?.value ? (
                  <div>Rated: {o.buyerRating.value} ★</div>
                ) : null}
              </div>
            </div>

            <div className="mt-2 small text-muted">
              {o.items
                ?.map((it) => `${it.name} x${it.quantity}`)
                .join(", ")}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default OrdersPage;
