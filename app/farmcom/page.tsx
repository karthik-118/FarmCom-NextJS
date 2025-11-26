
"use client";

import React, { useEffect, useState } from "react";
import Stack from "@/lib/contentstack";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import ProductCard from "@/components/ProductCard";
import Footer2 from "@/components/Footer2";
import { useStateValue } from "@/context/StateProvider";

interface Product {
  _id: string;
  name?: string;
  description?: any; // string or JSON (Contentstack)
  category?: string;
  price: number;
  imageUrl?: string;
  averageRating?: number;
  rating?: number;
  ratingCount?: number;
  createdAt?: string;
  source?: "mongo" | "cms";
  [key: string]: any;
}

interface CmsConfig {
  title: string;
  subtitle: string;
  hero_grad_start: string;
  hero_grad_end: string;
  body_grad_start: string;
  body_grad_end: string;
  api_base?: string;
  show_sidebar: boolean;
  grid_cols_md: number;
  loading_message: string;
  empty_message: string;
  card_bg: string;
  card_border: string;
  container_border: string;
}

interface ChatMessage {
  from: "user" | "bot";
  text: string;
}

const FarmCom: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cms, setCms] = useState<CmsConfig | null>(null);
  const [{ user }, dispatch] = useStateValue() as any;

  // === AI chat state ===
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // this should be your Contentstack Automations HTTP trigger URL
  const chatEndpoint =
    process.env.NEXT_PUBLIC_FARMCOM_CHAT_URL || "";

  // === Fetch CMS page config (farmcom_page) ===
  useEffect(() => {
    const fetchCMS = async () => {
      try {
        const Query = Stack.ContentType("farmcom_page").Query().toJSON();
        const res = await Query.find();
        const entry = res?.[0]?.[0];

        console.log("🟩 farmcom_page CMS raw:", res);

        if (!entry) throw new Error("FarmCom CMS entry not found");

        const mapped: CmsConfig = {
          title: entry.page_title || "FarmCom Marketplace",
          subtitle:
            entry.page_subtitle ||
            "Buy & sell farm tools, seeds, and fertilizers directly from trusted sellers.",
          hero_grad_start: entry.hero_gradient?.start || "#1a472a",
          hero_grad_end: entry.hero_gradient?.end || "#2e8b57",
          body_grad_start: entry.body_gradient?.start || "#f2fff2",
          body_grad_end: entry.body_gradient?.end || "#e9f7ef",
          api_base: entry.api_base || "",
          show_sidebar: entry.show_sidebar ?? true,
          grid_cols_md: entry.grid_cols_md || 3,
          loading_message: entry.loading_message || "Loading products...",
          empty_message: entry.empty_message || "No matching products.",
          card_bg: entry.card_styles?.bg || "#f9fff9",
          card_border: entry.card_styles?.border || "#d1e7dd",
          container_border:
            entry.card_styles?.container_border || "#d1e7dd",
        };

        setCms(mapped);
      } catch (err) {
        console.error("❌ FarmCom CMS fetch error:", err);
        setCms(null);
      }
    };

    fetchCMS();
  }, []);

  // === Fetch products from Contentstack "product" content type ===
  const fetchContentstackProducts = async (): Promise<Product[]> => {
    try {
      console.log("🟦 Fetching Contentstack products (content_type = 'product')");

      const res: any = await Stack.ContentType("product")
        .Query()
        .toJSON()
        .find();

      console.log("🟦 Contentstack product raw response:", res);

      const entriesArray = Array.isArray(res?.[0]) ? res[0] : [];
      console.log("🟦 Contentstack product entriesArray:", entriesArray);

      if (!entriesArray.length) {
        console.warn(
          "⚠️ No entries returned for content type 'product'. " +
            "Make sure you have PUBLISHED entries in this environment."
        );
      }

      const mapped: Product[] = entriesArray.map((entry: any) => {
        console.log("🟩 Mapping CMS product entry:", entry);

        const imageUrl =
          entry.image && entry.image.url ? entry.image.url : "";

        return {
          _id: entry.uid,
          name: entry.name || entry.title || "Unnamed product",
          description: entry.description || "",
          category: entry.category || "",
          price: Number(entry.price || 0),
          imageUrl,
          averageRating: 0,
          rating: 0,
          ratingCount: 0,
          createdAt: entry.created_at || undefined,
          source: "cms",
        };
      });

      console.log("🟩 Final mapped CMS products:", mapped);
      return mapped;
    } catch (err) {
      console.error("❌ Error fetching Contentstack products:", err);
      return [];
    }
  };

  useEffect(() => {
    const onSearch = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      const q = (detail.query || "").toLowerCase();

      setFiltered(
        (products || []).filter((p) => {
          const desc =
            typeof p.description === "string"
              ? p.description
              : p.description?.html || "";

          return [p.name, p.category, desc]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q);
        })
      );
    };

    const onFilter = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      const { category, tag } = detail as { category?: string; tag?: string };
      let temp = [...products];

      if (category) {
        temp = temp.filter(
          (p) => (p.category || "").toLowerCase() === category.toLowerCase()
        );
      }

      if (tag === "deals") temp = temp.filter((p) => Number(p.price) <= 999);
      else if (tag === "top")
        temp = temp.filter((p) => (p.averageRating || p.rating || 0) >= 4);
      else if (tag === "new")
        temp.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        );
      else if (tag === "organic")
        temp = temp.filter((p) => {
          const desc =
            typeof p.description === "string"
              ? p.description
              : p.description?.html || "";
          return (
            /organic|bio|natural/i.test(p.name || "") ||
            /organic|bio|natural/i.test(desc)
          );
        });
      else if (tag === "seasonal")
        temp = temp.filter((p) => {
          const desc =
            typeof p.description === "string"
              ? p.description
              : p.description?.html || "";
          return (
            /seasonal|monsoon|summer|winter/i.test(p.name || "") ||
            /seasonal|monsoon|summer|winter/i.test(desc)
          );
        });

      setFiltered(temp);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("farmcom:search", onSearch as EventListener);
      window.addEventListener("farmcom:filter", onFilter as EventListener);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(
          "farmcom:search",
          onSearch as EventListener
        );
        window.removeEventListener(
          "farmcom:filter",
          onFilter as EventListener
        );
      }
    };
  }, [products]);

  // === Load user from localStorage into context (once) ===
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedUser = localStorage.getItem("user");
    if (storedUser && !user) {
      dispatch({
        type: "SET_USER",
        user: JSON.parse(storedUser),
      });
    }
  }, [dispatch, user]);

  // === Fetch products from Next.js API + Contentstack ===
  useEffect(() => {
    const fetchAllProducts = async () => {
      setLoading(true);
      try {
        console.log("🟪 Fetching Mongo products from /api/products");
        let mongo: Product[] = [];
        try {
          const res = await fetch("/api/products");
          if (res.ok) {
            mongo = await res.json();
            mongo = mongo.map((p) => ({ ...p, source: "mongo" as const }));
          } else {
            console.warn(
              "⚠️ /api/products returned non-200:",
              res.status
            );
          }
        } catch (e) {
          console.error("❌ Error calling /api/products:", e);
        }

        console.log("🟪 Fetching CMS products (product content type)");
        const cmsProducts = await fetchContentstackProducts();

        const merged = [...mongo, ...cmsProducts];
        console.log(
          `🟩 Merged products: mongo=${mongo.length}, cms=${cmsProducts.length}, total=${merged.length}`
        );

        setProducts(merged);
        setFiltered(merged);
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };

    if (cms) fetchAllProducts();
  }, [cms]);

  // === Sidebar filters/sort ===
  const handleFilterChange = (filters: {
    category: string;
    sort: string;
    minPrice: string;
    maxPrice: string;
  }) => {
    let temp = [...products];

    if (filters.category)
      temp = temp.filter(
        (p) =>
          p.category &&
          p.category.toLowerCase() === filters.category.toLowerCase()
      );
    if (filters.minPrice)
      temp = temp.filter(
        (p) => Number(p.price) >= Number(filters.minPrice)
      );
    if (filters.maxPrice)
      temp = temp.filter(
        (p) => Number(p.price) <= Number(filters.maxPrice)
      );

    if (filters.sort === "priceLowHigh") temp.sort((a, b) => a.price - b.price);
    else if (filters.sort === "priceHighLow")
      temp.sort((a, b) => b.price - a.price);
    else if (filters.sort === "latest")
      temp.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );

    setFiltered(temp);
  };

  // === Chat send handler (expects plain text from automation) ===
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const message = chatInput.trim();
    if (!message) return;

    setChatMessages((prev) => [...prev, { from: "user", text: message }]);
    setChatInput("");

    if (!chatEndpoint) {
      setChatMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text:
            "Chat service is not configured yet. Please set NEXT_PUBLIC_FARMCOM_CHAT_URL.",
        },
      ]);
      return;
    }

    try {
      setChatLoading(true);
      const res = await fetch(chatEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        throw new Error(`Chat endpoint returned ${res.status}`);
      }

      // your Response step sends plain text from `2.response.0.content.parts.0.text`
      const contentType = res.headers.get("content-type") || "";
      let answer: string;

      if (contentType.includes("application/json")) {
        const data = await res.json();
        answer =
          data.answer || data.response || data.text || JSON.stringify(data);
      } else {
        answer = await res.text();
      }

      setChatMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: answer,
        },
      ]);
    } catch (err) {
      console.error("❌ FarmCom chat error:", err);
      setChatMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text:
            "Sorry, FarmCom Assistant is not reachable right now. Please try again.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  if (!cms)
    return (
      <>
        <Header />
        <div className="text-center mt-5 text-danger">
          Failed to load FarmCom content from CMS.
        </div>
      </>
    );

  const listToRender = (filtered.length ? filtered : products) || [];
  const mongoCount = products.filter((p) => p.source === "mongo").length;
  const cmsCount = products.filter((p) => p.source === "cms").length;

  return (
    <>
      <Header />

      <div
        className="container-fluid py-4"
        style={{
          background: `linear-gradient(180deg, ${cms.body_grad_start} 0%, ${cms.body_grad_end} 100%)`,
          minHeight: "100vh",
        }}
      >
        <div className="row">
          {/* Sidebar */}
          {cms.show_sidebar && (
            <Sidebar onFilterChange={handleFilterChange} />
          )}

          <main
            className={`${
              cms.show_sidebar ? "col-md-9" : "col-md-12"
            } mx-auto p-4 rounded-4 shadow-lg`}
            style={{
              backgroundColor: "#ffffff",
              border: `2px solid ${cms.container_border}`,
            }}
          >
            {/* Header + Chat button */}
            <div
              className="mb-4 p-3 rounded text-white d-flex justify-content-between align-items-start flex-wrap gap-2"
              style={{
                background: `linear-gradient(90deg, ${cms.hero_grad_start}, ${cms.hero_grad_end})`,
              }}
            >
              <div>
                <h3 className="fw-bold mb-1">{cms.title}</h3>
                <p className="mb-0">{cms.subtitle}</p>
              </div>
              <button
                type="button"
                className="btn btn-light btn-sm mt-2 mt-md-0"
                onClick={() => setChatOpen(true)}
              >
                💬 Chat with FarmCom AI
              </button>
            </div>

            {/* Small debug line */}
            <div className="small text-muted mb-2">
              Mongo products: {mongoCount} · CMS products: {cmsCount} · Total:{" "}
              {products.length}
            </div>

            {/* Product Grid */}
            {loading ? (
              <div className="text-center w-100 text-muted">
                {cms.loading_message}
              </div>
            ) : (
              <div
                className={`row row-cols-1 row-cols-md-${cms.grid_cols_md} g-4 mb-4`}
              >
                {listToRender.length > 0 ? (
                  listToRender.map((p) => (
                    <div key={p._id} className="col">
                      <div
                        className="p-3 rounded-3 shadow-sm"
                        style={{
                          backgroundColor: cms.card_bg,
                          border: `1px solid ${cms.card_border}`,
                        }}
                      >
                        <ProductCard product={p} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center w-100 text-muted">
                    {cms.empty_message}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>

        <Footer2 />
      </div>

      {/* Floating Chat Widget */}
      {chatOpen && (
        <div
          className="card shadow-lg position-fixed"
          style={{
            bottom: "1.5rem",
            right: "1.5rem",
            width: "320px",
            maxHeight: "60vh",
            zIndex: 1050,
          }}
        >
          <div className="card-header d-flex justify-content-between align-items-center bg-success text-white py-2">
            <span className="fw-semibold small">Chat with FarmCom AI</span>
            <button
              type="button"
              className="btn-close btn-close-white btn-sm"
              aria-label="Close"
              onClick={() => setChatOpen(false)}
            />
          </div>
          <div
            className="card-body p-2"
            style={{ overflowY: "auto", maxHeight: "40vh", fontSize: "0.9rem" }}
          >
            {chatMessages.length === 0 && (
              <div className="text-muted small">
                Ask anything about crops, seeds, fertilizers, or tools 🌿
              </div>
            )}
            {chatMessages.map((m, idx) => (
              <div
                key={idx}
                className={`mb-2 d-flex ${
                  m.from === "user"
                    ? "justify-content-end"
                    : "justify-content-start"
                }`}
              >
                <span
                  className={`px-2 py-1 rounded-3 ${
                    m.from === "user"
                      ? "bg-primary text-white"
                      : "bg-light border"
                  }`}
                >
                  {m.text}
                </span>
              </div>
            ))}
            {chatLoading && (
              <div className="small text-muted">FarmCom is thinking…</div>
            )}
          </div>
          <form onSubmit={handleSendChat} className="card-footer p-2">
            <div className="input-group input-group-sm">
              <input
                type="text"
                className="form-control"
                placeholder="Type your question…"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={chatLoading}
              />
            </div>
            <div className="d-flex justify-content-end mt-1">
              <button
                className="btn btn-success btn-sm"
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default FarmCom;
