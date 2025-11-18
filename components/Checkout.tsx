"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent } from "react";
// ✅ Use the same Contentstack config as Header/Footer
import Stack from "@/lib/contentstack";

interface CheckoutProps {
  cartFromContext?: any[];
}

const Checkout: React.FC<CheckoutProps> = ({ cartFromContext = [] }) => {
  // ---------------- State ----------------
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    paymentMethod: "COD",
  });

  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvv: "",
    upiId: "",
    bank: "",
  });

  const [cart, setCart] = useState<any[]>(cartFromContext || []);
  const [msg, setMsg] = useState("");
  const [cms, setCms] = useState<any>(null);

  // ---------------- CMS fetch (optional) ----------------
  useEffect(() => {
    (async () => {
      try {
        const res = await Stack.ContentType("checkout_page")
          .Query()
          .toJSON()
          .find();
        const entry = res?.[0]?.[0] || null;
        setCms(entry);
      } catch (e) {
        console.warn("Checkout CMS fetch failed:", e);
      }
    })();
  }, []);

  // Safe groups with defaults
  const gTop = cms?.top_global || {};
  const gShip = cms?.shipping_customer_form || {};
  const gPaySel = cms?.payment_selector || {};
  const gCard = cms?.card_section || {};
  const gUpi = cms?.upi_section || {};
  const gNet = cms?.net_banking_section || {};
  const gBanks = Array.isArray(gNet?.bank_list) ? gNet.bank_list : [];
  const gSum = cms?.net_banking_section?.order_summary || {};

  // ---------------- Cart load/sync ----------------
  useEffect(() => {
    if (cartFromContext && cartFromContext.length > 0) {
      setCart(cartFromContext);
    } else if (typeof window !== "undefined") {
      const saved = JSON.parse(localStorage.getItem("cart") || "[]");
      setCart(saved);
    }
  }, [cartFromContext]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) =>
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handlePaymentChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) =>
    setPaymentDetails((s) => ({ ...s, [e.target.name]: e.target.value }));

  // ---------------- Submit ----------------
  const handleOrder = async (e: FormEvent) => {
    e.preventDefault();
    setMsg("");

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("authToken")
        : null;
    const user =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("user") || "null")
        : null;

    if (!token || !user) {
      setMsg(
        gTop.login_required_message ||
          "Please log in to place your order."
      );
      return;
    }
    if (!cart || cart.length === 0) {
      setMsg(gTop.empty_cart_message || "Your cart is empty.");
      return;
    }

    const payload = {
      customerId: user._id,
      customerName: formData.name,
      customerEmail: user?.email || "",
      paymentMethod: formData.paymentMethod,
      status: "Pending",
      shippingDetails: {
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
      },
      products: cart.map((item) => ({
        productId: item._id,
        sellerId: item.sellerId,
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
      })),
      totalAmount: cart.reduce(
        (s, it) =>
          s + (Number(it.price) || 0) * (it.quantity || 1),
        0
      ),
    };

    try {
      // ✅ Now hitting Next.js API: app/api/orders/route.ts
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // token not used in API yet, but harmless to send
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setMsg(data.message || "⚠️ Failed to place order.");
        return;
      }

      setMsg(
        gTop.order_success_message ||
          "✅ Order placed successfully!"
      );

      if (typeof window !== "undefined") {
        localStorage.removeItem("cart");
        window.dispatchEvent(new CustomEvent("farmcom:cart:clear"));
      }

      setCart([]);
      setFormData({
        name: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        paymentMethod: "COD",
      });
      setPaymentDetails({
        cardNumber: "",
        cardName: "",
        expiry: "",
        cvv: "",
        upiId: "",
        bank: "",
      });
    } catch (err: any) {
      setMsg(
        (gTop.generic_error_prefix || "❌ Error: ") +
          err.message
      );
    }
  };

  const total = Array.isArray(cart)
    ? cart.reduce(
        (sum, item) =>
          sum +
          (Number(item.price) || 0) * (item.quantity || 1),
        0
      )
    : 0;

  return (
    <div className="container py-5">
      <div className="row g-4">
        {/* Left - Checkout Form */}
        <div className="col-lg-7">
          <div className="card shadow-sm p-4">
            <h4 className="mb-3 text-success fw-bold text-center">
              {gTop.checkout_title || "🛒 Checkout"}
            </h4>

            <form onSubmit={handleOrder}>
              <input
                type="text"
                className="form-control mb-2"
                name="name"
                placeholder={
                  gShip.full_name_placeholder || "Full Name"
                }
                value={formData.name}
                onChange={handleChange}
                required
              />
              <input
                type="tel"
                className="form-control mb-2"
                name="phone"
                placeholder={
                  gShip.phone_placeholder || "Phone Number"
                }
                value={formData.phone}
                onChange={handleChange}
                required
              />
              <textarea
                className="form-control mb-2"
                name="address"
                placeholder={
                  gShip.address_placeholder || "Full Address"
                }
                value={formData.address}
                onChange={handleChange}
                required
              />
              <div className="row">
                <div className="col-md-6 mb-2">
                  <input
                    type="text"
                    className="form-control"
                    name="city"
                    placeholder={gShip.city_placeholder || "City"}
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-2">
                  <input
                    type="text"
                    className="form-control"
                    name="state"
                    placeholder={gShip.state_placeholder || "State"}
                    value={formData.state}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <input
                type="text"
                className="form-control mb-3"
                name="pincode"
                placeholder={
                  gShip.pincode_placeholder || "Pincode"
                }
                value={formData.pincode}
                onChange={handleChange}
                required
              />

              {/* Payment Method */}
              <label className="fw-bold mb-2">
                {gPaySel.payment_select_label ||
                  "Select Payment Method:"}
              </label>
              <div className="d-flex gap-3 flex-wrap mb-3">
                {["COD", "CARD", "UPI", "NETBANKING"].map(
                  (method) => (
                    <div
                      key={method}
                      className="form-check form-check-inline"
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        id={method}
                        value={method}
                        checked={
                          formData.paymentMethod === method
                        }
                        onChange={handleChange}
                        className="form-check-input"
                      />
                      <label
                        className="form-check-label"
                        htmlFor={method}
                      >
                        {method === "COD"
                          ? gPaySel.payment_cod_label ||
                            "Cash on Delivery"
                          : method === "CARD"
                          ? gPaySel.payment_card_label ||
                            "Credit/Debit Card"
                          : method === "UPI"
                          ? gPaySel.payment_upi_label ||
                            "UPI"
                          : gPaySel.payment_netbanking_label ||
                            "Net Banking"}
                      </label>
                    </div>
                  )
                )}
              </div>

              {/* (You can keep / remove detailed payment fields as before) */}

              <button
                className="btn btn-success w-100 fw-bold py-2"
                type="submit"
              >
                {gTop.place_order_label || "Place Order"}
              </button>
            </form>

            {msg && (
              <div className="alert alert-info text-center mt-3">
                {msg}
              </div>
            )}
          </div>
        </div>

        {/* Right - Order Summary */}
        <div className="col-lg-5">
          <div className="card shadow-sm p-4 bg-light">
            <h5 className="fw-bold mb-3">
              {gSum.summary_title || "🧾 Order Summary"}
            </h5>
            {cart.length > 0 ? (
              <>
                {cart.map((item, index) => (
                  <div
                    key={index}
                    className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2"
                  >
                    <div>
                      <h6 className="mb-0">{item.name}</h6>
                      <small className="text-muted">
                        ₹{item.price}
                      </small>
                    </div>
                    <span className="fw-semibold">
                      x{item.quantity || 1}
                    </span>
                  </div>
                ))}
                <div className="d-flex justify-content-between mt-3">
                  <span className="fw-bold">
                    {gSum.summary_total_label || "Total:"}
                  </span>
                  <span className="fw-bold text-success">
                    ₹{total}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-muted text-center">
                {gSum.summary_no_items || "No items in cart"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
