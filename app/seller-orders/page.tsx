"use client";

import React, { useEffect, useState } from "react";
import Stack from "@/lib/contentstack";

interface SellerOrder {
  _id: string;
  status: string;
  total: number;
  customerName?: string;
  customerEmail?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  items?: { name: string; quantity: number }[];
  [key: string]: any;
}

const SellerOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [cms, setCms] = useState<any>(null);

  const getToken = () =>
    typeof window !== "undefined"
      ? localStorage.getItem("authToken")
      : null;

  // ---------------- CMS FETCH ----------------
  useEffect(() => {
    (async () => {
      try {
        const res = await Stack.ContentType("seller_orders")
          .Query()
          .toJSON()
          .find();
        setCms(res?.[0]?.[0] || {});
      } catch (e) {
        console.warn("CMS fetch failed:", e);
      }
    })();
  }, []);

  const T = {
    title: cms?.page_title || "Seller Orders",
    loading: cms?.top_messages?.loading_label || "Loading orders…",
    noOrders:
      cms?.top_messages?.no_orders_message ||
      "No orders found for this seller.",
    onlySellers:
      cms?.top_messages?.only_sellers_message ||
      "Only sellers can access this page.",
    errPrefix: cms?.top_messages?.generic_error_prefix || "Error: ",
    L: {
      order: cms?.order_labels?.order_label || "Order:",
      status: cms?.order_labels?.status_label || "Status:",
      total: cms?.order_labels?.total_label || "Total:",
      customer: cms?.order_labels?.customer_label || "Customer:",
      email: cms?.order_labels?.email_label || "Email:",
      shipTo: cms?.order_labels?.ship_to_label || "Ship to:",
      items: cms?.order_labels?.items_label || "Items:",
      currency: cms?.order_labels?.currency_prefix || "₹",
    },
    B: {
      deliver: cms?.buttons?.mark_delivered_label || "Mark Delivered",
      delivered: cms?.buttons?.delivered_badge_label || "Delivered",
      emailBuyer:
        cms?.buttons?.email_buyer_label || "✉️ Email Buyer",
      emailDisabled:
        cms?.buttons?.email_buyer_disabled_tooltip ||
        "No buyer email",
    },
    E: {
      subj:
        cms?.email_templates?.subject_template ||
        "Regarding your FarmCom order {{order_id}}",
      body:
        cms?.email_templates?.body_template ||
        "Hi,\n\nThis is regarding your order {{order_id}}.\n\nItems: {{items_list}}\nTotal: {{currency}}{{total}}\n\nThanks,\nSeller",
    },
  };

  // ---------------- FETCH ORDERS (FIXED) ----------------
  const fetchOrders = async () => {
    const token = getToken();
    if (!token) return;

    setLoading(true);
    setErr("");

    try {
      const res = await fetch("/api/orders/seller", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `${T.errPrefix}${res.status}: ${text || "Failed to fetch orders"}`
        );
      }

      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error("SellerOrders fetch error:", e);
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------- MARK DELIVERED ----------------
  const markDelivered = async (orderId: string) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`/api/orders/${orderId}/deliver`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to mark delivered");

      fetchOrders();
    } catch (e: any) {
      console.error("markDelivered error:", e);
      setErr(e.message);
    }
  };

  // ---------------- EMAIL BUYER ----------------
  const emailBuyer = (order: SellerOrder) => {
    if (!order.customerEmail) return alert(T.B.emailDisabled);

    const itemsList =
      order.items
        ?.map((it) => `${it.name} x${it.quantity}`)
        .join(", ") || "";

    const subject = encodeURIComponent(
      T.E.subj.replace("{{order_id}}", order._id)
    );

    const body = encodeURIComponent(
      T.E.body
        .replace("{{order_id}}", order._id)
        .replace("{{items_list}}", itemsList)
        .replace("{{currency}}", T.L.currency)
        .replace("{{total}}", String(order.total))
    );

    window.location.href = `mailto:${order.customerEmail}?subject=${subject}&body=${body}`;
  };

  // ---------------- UI ----------------
  return (
    <div className="container my-4">
      <h3 className="mb-3">{T.title}</h3>

      {err && <div className="alert alert-danger">{err}</div>}
      {loading && <div className="alert alert-secondary">{T.loading}</div>}

      {!loading && orders.length === 0 && !err && (
        <div className="alert alert-info">{T.noOrders}</div>
      )}

      {orders.map((o) => (
        <div
          key={o._id}
          className="card mb-3 p-3 d-flex flex-md-row justify-content-between align-items-start"
          style={{ gap: 12 }}
        >
          <div className="flex-grow-1">
            <div>
              <strong>{T.L.order}</strong> {o._id}
            </div>
            <div>
              <strong>{T.L.status}</strong> {o.status}
            </div>
            <div>
              <strong>{T.L.total}</strong> {T.L.currency}
              {o.total}
            </div>

            {o.customerName && (
              <div className="small">
                <strong>{T.L.customer}</strong> {o.customerName}
              </div>
            )}

            {o.customerEmail && (
              <div className="small text-muted">
                <strong>{T.L.email}</strong> {o.customerEmail}
              </div>
            )}

            {o.address && (
              <div className="small text-muted mt-1">
                <strong>{T.L.shipTo}</strong>{" "}
                {[
                  o.address.line1,
                  o.address.line2,
                  o.address.city,
                  o.address.state,
                  o.address.postalCode,
                  o.address.country,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </div>
            )}

            <div className="small text-muted mt-1">
              {(o.items || [])
                .map((it) => `${it.name} x${it.quantity}`)
                .join(", ")}
            </div>
          </div>

          <div className="text-end d-flex flex-column gap-2">
            {o.status !== "delivered" ? (
              <button
                className="btn btn-success btn-sm"
                onClick={() => markDelivered(o._id)}
              >
                {T.B.deliver}
              </button>
            ) : (
              <span className="badge bg-success align-self-end">
                {T.B.delivered}
              </span>
            )}

            <button
              className="btn btn-outline-primary btn-sm"
              onClick={() => emailBuyer(o)}
              disabled={!o.customerEmail}
              title={
                o.customerEmail ? T.B.emailBuyer : T.B.emailDisabled
              }
            >
              {T.B.emailBuyer}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SellerOrdersPage;
