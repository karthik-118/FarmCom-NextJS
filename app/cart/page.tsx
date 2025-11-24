"use client";

import React, { useEffect, useState } from "react";
import Stack from "@/lib/contentstack";
import { useStateValue } from "@/context/StateProvider";
import Checkout from "@/components/Checkout";

interface CmsCartText {
  page_title?: string;
  empty_message?: string;
  loading_message?: string;
  warning_message?: string;
  total_label?: string;
  clear_button_label?: string;
  remove_button_label?: string;
  checkout_missing?: string;
  [key: string]: any;
}

const CartPage: React.FC = () => {
  const [{ cart }, dispatch] = useStateValue() as any;
  const [loading, setLoading] = useState(true);
  const [cmsText, setCmsText] = useState<CmsCartText | null>(null);

  // ✅ use same-origin API (NO :8000)
  const apiBase = ""; // falsy → Checkout uses "/api/orders"

  // Load CMS text (singleton: cart_page)
  useEffect(() => {
    (async () => {
      try {
        const Query = Stack.ContentType("cart_page").Query();
        const res = await Query.toJSON().find();
        const entry = res?.[0]?.[0] || null;
        setCmsText(entry);
      } catch (e) {
        console.warn("CartPage CMS fetch failed:", e);
      }
    })();
  }, []);

  // Initialize cart from localStorage
  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("cart") || "[]")
        : [];
    if (!Array.isArray(cart) || cart.length === 0) {
      dispatch({ type: "SET_CART", cart: stored });
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync cart to localStorage
  useEffect(() => {
    if (Array.isArray(cart) && typeof window !== "undefined") {
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }, [cart]);

  const removeFromCart = (index: number) => {
    dispatch({ type: "REMOVE_FROM_CART", index });
  };

  const total = Array.isArray(cart)
    ? cart.reduce(
        (sum: number, item: any) => sum + Number(item?.price || 0),
        0
      )
    : 0;

  const t = {
    page_title: cmsText?.page_title || "🛒 Your Cart",
    empty_message: cmsText?.empty_message || "Your cart is empty.",
    loading_message: cmsText?.loading_message || "Loading cart...",
    warning_message:
      cmsText?.warning_message || "Cart not initialized yet.",
    total_label: cmsText?.total_label || "Total:",
    clear_button_label: cmsText?.clear_button_label || "Clear Cart",
    remove_button_label: cmsText?.remove_button_label || "Remove",
    checkout_missing:
      cmsText?.checkout_missing || "Checkout component not found.",
  };

  if (loading) {
    return (
      <div className="container my-5 text-center">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">{t.loading_message}</span>
        </div>
      </div>
    );
  }

  if (!Array.isArray(cart)) {
    return (
      <div className="container my-5">
        <h2 className="mb-4">{t.page_title}</h2>
        <div className="alert alert-warning">{t.warning_message}</div>
      </div>
    );
  }

  return (
    <div className="container my-5">
      <h2 className="mb-4">{t.page_title}</h2>

      {cart.length === 0 ? (
        <div className="alert alert-info text-center">
          {t.empty_message}
        </div>
      ) : (
        <>
          <ul className="list-group mb-4">
            {cart.map((item: any, index: number) => (
              <li
                key={`${item?._id || item?.id || "item"}-${index}`}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <div>
                  <h6 className="fw-semibold mb-0">
                    {item?.name || "Item"}
                  </h6>
                  <small className="text-muted">
                    ₹{Number(item?.price || 0).toFixed(2)}
                  </small>
                </div>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => removeFromCart(index)}
                >
                  {t.remove_button_label}
                </button>
              </li>
            ))}
          </ul>

          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5 className="fw-bold">
              {t.total_label} ₹{total.toFixed(2)}
            </h5>
            <button
              className="btn btn-outline-danger fw-semibold"
              onClick={() => dispatch({ type: "EMPTY_CART" })}
            >
              {t.clear_button_label}
            </button>
          </div>

          {Checkout ? (
            <Checkout apiBase={apiBase} cartFromContext={cart} />
          ) : (
            <div className="alert alert-secondary">
              {t.checkout_missing}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CartPage;
