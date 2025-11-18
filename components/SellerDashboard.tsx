"use client";

import React, {
  useEffect,
  useState,
  ChangeEvent,
  FormEvent,
} from "react";
import Stack from "@/lib/contentstack";

interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  imageUrl?: string;
  sellerId?: string;
  [key: string]: any;
}

interface CmsNavbar {
  brand_label?: string;
  add_button_label?: string;
  list_button_label?: string;
  logout_button_label?: string;
}

interface CmsAddSection {
  section_title?: string;
  name_placeholder?: string;
  description_placeholder?: string;
  price_placeholder?: string;
  category_placeholder?: string;
  image_input_label?: string;
  submit_button_label?: string;
}

interface CmsListSection {
  section_title?: string;
  no_products_text?: string;
  price_prefix?: string;
  delete_button_label?: string;
  no_image_placeholder_url?: string;
}

interface CmsMessages {
  fetch_products_fail_prefix?: string;
  only_sellers?: string;
  add_success?: string;
  add_fail_prefix?: string;
  delete_confirm?: string;
  delete_success?: string;
  delete_fail_prefix?: string;
}

interface SellerDashboardEntry {
  navbar?: CmsNavbar;
  add_section?: CmsAddSection;
  list_section?: CmsListSection;
  messages?: CmsMessages;
  [key: string]: any;
}

const SellerDashboard: React.FC = () => {
  const [view, setView] = useState<"add" | "list">("add");
  const [product, setProduct] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
  });
  const [image, setImage] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [cms, setCms] = useState<SellerDashboardEntry | null>(null);

  // ===== Auth (client only) =====
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("authToken")
      : null;
  const user =
    typeof window !== "undefined"
      ? JSON.parse(window.localStorage.getItem("user") || "{}")
      : {};

  const sellerId =
    (user?.id || user?._id || user?.userId || "").toString() || "";

  if (typeof window !== "undefined") {
    console.log("🟦 LOCALSTORAGE USER RAW:", window.localStorage.getItem("user"));
    console.log("🟦 Parsed user object:", user);
    console.log("🟦 Computed sellerId:", sellerId);
  }

  // ===== CMS fetch =====
  useEffect(() => {
    (async () => {
      try {
        const res = await Stack.ContentType("seller_dashboard")
          .Query()
          .toJSON()
          .find();
        setCms((res?.[0]?.[0] as SellerDashboardEntry) || {});
      } catch (e) {
        console.warn("SellerDashboard CMS fetch failed:", e);
      }
    })();
  }, []);

  const nb: CmsNavbar = cms?.navbar || {};
  const add: CmsAddSection = cms?.add_section || {};
  const list: CmsListSection = cms?.list_section || {};
  const msgT: CmsMessages = cms?.messages || {};

  // ===== Fetch only THIS seller's products (via query param) =====
  const fetchProducts = async () => {
    console.log("🟪 fetchProducts() called, sellerId =", sellerId);

    if (!sellerId) {
      console.log("🟥 No sellerId, skipping fetch");
      setProducts([]);
      return;
    }

    try {
      const url = `/api/products?sellerId=${encodeURIComponent(
        sellerId
      )}`;
      console.log("🟪 Fetching:", url);

      const res = await fetch(url, { method: "GET" });
      const txt = await res.text();

      console.log("🟪 /api/products?sellerId raw response:", txt);

      if (!txt) {
        console.log("🟥 Empty response body");
        setProducts([]);
        return;
      }

      let mine: Product[] = [];
      try {
        mine = JSON.parse(txt);
      } catch (e) {
        console.error("🟥 JSON parse error for /api/products?sellerId:", e);
        setProducts([]);
        return;
      }

      console.log("🟩 Products for this seller from backend:", mine);
      setProducts(Array.isArray(mine) ? mine : []);
    } catch (err: any) {
      console.error("🟥 fetchProducts error:", err);
      setMessage(
        (msgT.fetch_products_fail_prefix ||
          "⚠️ Failed to load your products: ") + err.message
      );
    }
  };

  useEffect(() => {
    if (view === "list") {
      console.log("🔁 Switched to 'list' view → fetchProducts()");
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // ===== Form handlers =====
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) =>
    setProduct((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
  };

  // ===== Add product =====
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!user?.role || user.role !== "seller") {
      setMessage(
        msgT.only_sellers || "❌ Only sellers can add products."
      );
      return;
    }

    try {
      let imageUrl = "";

      // 1️⃣ Upload image (optional)
      if (image) {
        const formData = new FormData();
        formData.append("image", image);

        console.log("🟦 Uploading image → /api/upload/image");
        const uploadRes = await fetch("/api/upload/image", {
          method: "POST",
          body: formData,
        });

        const uploadText = await uploadRes.text();
        console.log("🟦 upload response text:", uploadText);

        if (!uploadRes.ok) {
          let errMsg = `Image upload failed (${uploadRes.status})`;
          try {
            const json = JSON.parse(uploadText);
            errMsg = json.message || errMsg;
          } catch {}
          throw new Error(errMsg);
        }

        const uploadData = JSON.parse(uploadText);
        imageUrl = uploadData.url;
        console.log("🟩 Image uploaded. URL:", imageUrl);
      }

      // 2️⃣ Create product
      console.log("🟦 Creating product → /api/products");
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...product,
          price: Number(product.price),
          imageUrl,
          sellerId, // 👈 VERY IMPORTANT
        }),
      });

      const text = await res.text();
      console.log("🟦 /api/products POST raw response:", text);

      if (!res.ok) {
        let errMsg = `Failed to add product (${res.status})`;
        try {
          const json = JSON.parse(text);
          errMsg = json.message || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      setMessage(
        msgT.add_success || "✅ Product added successfully!"
      );
      setProduct({
        name: "",
        description: "",
        price: "",
        category: "",
      });
      setImage(null);

      if (view === "list") {
        console.log("🔁 Refresh list after add");
        fetchProducts();
      }
    } catch (err: any) {
      console.error("🟥 Add product error:", err);
      setMessage((msgT.add_fail_prefix || "❌ ") + err.message);
    }
  };

  // ===== Delete product =====
 // ---- Delete product ----
const handleDelete = async (id: string) => {
  if (
    typeof window !== "undefined" &&
    !window.confirm(
      msgT.delete_confirm ||
        "Are you sure you want to delete this product?"
    )
  )
    return;

  console.log("🗑️ Deleting product id =", id);

  try {
    const res = await fetch(`/api/products/${id}`, {
      method: "DELETE",
    });

    const text = await res.text();
    console.log("🟦 /api/products/[id] DELETE raw response:", text);

    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    // ✅ Treat 200 & 404-style messages as success on frontend
    if (!res.ok) {
      const msg =
        (json && json.message) ||
        `Failed to delete product (${res.status})`;
      throw new Error(msg);
    }

    // Remove from UI
    setProducts((prev) => prev.filter((p) => p._id !== id));
    setMessage(
      msgT.delete_success || "✅ Product deleted successfully!"
    );
  } catch (err: any) {
    console.error("🟥 Delete error:", err);
    setMessage((msgT.delete_fail_prefix || "❌ ") + err.message);
  }
};


  // ===== UI =====
  return (
    <div className="container mt-4">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-success rounded mb-4 px-3 shadow">
        <span className="navbar-brand fw-bold">
          {nb.brand_label || "🌿 Seller Dashboard"}
        </span>
        <div>
          <button
            className={`btn btn-sm me-2 ${
              view === "add"
                ? "btn-light text-success"
                : "btn-outline-light"
            }`}
            onClick={() => setView("add")}
          >
            {nb.add_button_label || "➕ Add Product"}
          </button>
          <button
            className={`btn btn-sm me-2 ${
              view === "list"
                ? "btn-light text-success"
                : "btn-outline-light"
            }`}
            onClick={() => setView("list")}
          >
            {nb.list_button_label || "📦 My Products"}
          </button>
          <button
            className="btn btn-sm btn-danger"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.localStorage.removeItem("authToken");
                window.localStorage.removeItem("user");
                window.location.reload();
              }
            }}
          >
            {nb.logout_button_label || "Logout"}
          </button>
        </div>
      </nav>

      {/* Add product view */}
      {view === "add" && (
        <div className="card p-4 shadow-sm border-success border-2">
          <h4 className="text-success mb-3">
            {add.section_title || "Add Product"}
          </h4>
          <form
            onSubmit={handleSubmit}
            style={{ maxWidth: "500px" }}
          >
            <input
              type="text"
              name="name"
              className="form-control mb-2"
              placeholder={add.name_placeholder || "Product Name"}
              value={product.name}
              onChange={handleChange}
              required
            />
            <textarea
              name="description"
              className="form-control mb-2"
              placeholder={
                add.description_placeholder ||
                "Product Description"
              }
              value={product.description}
              onChange={handleChange}
              required
            />
            <input
              type="number"
              name="price"
              className="form-control mb-2"
              placeholder={add.price_placeholder || "Price"}
              value={product.price}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="category"
              className="form-control mb-2"
              placeholder={
                add.category_placeholder ||
                "Category (e.g., Farm Tools)"
              }
              value={product.category}
              onChange={handleChange}
              required
            />
            <label className="form-label">
              {add.image_input_label || "Product Image"}
            </label>
            <input
              type="file"
              accept="image/*"
              className="form-control mb-2"
              onChange={handleImageChange}
            />
            <button
              className="btn btn-success w-100 mt-3 fw-bold"
              type="submit"
            >
              {add.submit_button_label || "Add Product"}
            </button>
          </form>
          {message && (
            <div className="alert alert-info mt-3 text-center">
              {message}
            </div>
          )}
        </div>
      )}

      {/* List products view */}
      {view === "list" && (
        <div>
          <h4 className="mb-3 text-success fw-bold">
            {list.section_title || "My Products"}
          </h4>
          <div className="row">
            {products.length === 0 ? (
              <>
                <p className="text-muted">
                  {list.no_products_text ||
                    "No products uploaded yet."}
                </p>
                <pre className="bg-light p-2 border rounded small">
                  sellerId = {sellerId || "undefined"}
                  {"\n"}
                  products.length = {products.length}
                </pre>
              </>
            ) : (
              products.map((p) => (
                <div key={p._id} className="col-md-4 mb-3">
                  <div
                    className="card shadow-sm border-0"
                    style={{
                      borderRadius: "12px",
                      backgroundColor: "#f9fff8",
                    }}
                  >
                    <img
                      src={
                        p.imageUrl?.startsWith("http")
                          ? p.imageUrl
                          : p.imageUrl
                          ? p.imageUrl
                          : list.no_image_placeholder_url ||
                            "https://via.placeholder.com/300x180?text=No+Image"
                      }
                      alt={p.name}
                      className="card-img-top"
                      style={{
                        height: "180px",
                        objectFit: "cover",
                        borderTopLeftRadius: "12px",
                        borderTopRightRadius: "12px",
                      }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          list.no_image_placeholder_url ||
                          "https://via.placeholder.com/300x180?text=No+Image";
                      }}
                    />
                    <div className="card-body text-center">
                      <h5>{p.name}</h5>
                      <p className="text-muted small">
                        {p.category}
                      </p>
                      <p>
                        {(p.description || "").slice(0, 60)}
                        {p.description &&
                        p.description.length > 60
                          ? "..."
                          : ""}
                      </p>
                      <p className="fw-bold text-success">
                        {(list.price_prefix || "₹")}
                        {p.price}
                      </p>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(p._id)}
                      >
                        {list.delete_button_label || "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {message && view === "list" && (
            <div className="alert alert-info mt-3 text-center">
              {message}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;
