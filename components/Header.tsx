"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Cart, GeoAlt, PersonCircle, ChevronDown } from "react-bootstrap-icons";
import { useStateValue } from "@/context/StateProvider";
import Stack from "@/lib/contentstack"; // Next.js Contentstack config

// ---------- Helpers ----------
const safeStr = (v: unknown): string =>
  typeof v === "string" ? v.trim() : "";

const safeUrl = (u?: string): string => {
  if (!u) return "";
  return u.startsWith("//") ? `https:${u}` : u;
};

const getCategories = (entry: any): string[] =>
  Array.isArray(entry?.categories?.category_name)
    ? entry.categories.category_name.map(safeStr).filter(Boolean)
    : [];

const getQuickFilters = (entry: any): string[] =>
  Array.isArray(entry?.quick_filters?.filter_name)
    ? entry.quick_filters.filter_name.map(safeStr).filter(Boolean)
    : [];

interface MenuItem {
  label: string;
  link: string;
}

const getProfileMenu = (entry: any): MenuItem[] =>
  Array.isArray(entry?.profile_menu?.link_name)
    ? entry.profile_menu.link_name
        .map((l: any) => ({
          label: safeStr(l?.title || l?.label || ""),
          link: safeStr(l?.href || l?.url || ""),
        }))
        .filter((m: MenuItem) => m.label && m.link)
    : [];

const getSellerMenu = (entry: any): MenuItem[] =>
  Array.isArray(entry?.seller_menu?.seller_specific_options_)
    ? entry.seller_menu.seller_specific_options_
        .map((l: any) => ({
          label: safeStr(l?.title || l?.label || ""),
          link: safeStr(l?.href || l?.url || ""),
        }))
        .filter((m: MenuItem) => m.label && m.link)
    : [];

interface Gradient {
  start: string;
  end: string;
}

const parseGradientFromJsonRte = (rte: any): Gradient | null => {
  if (!rte || rte.type !== "doc" || !Array.isArray(rte.children)) return null;
  const text = rte.children
    .flatMap((node: any) =>
      Array.isArray(node?.children)
        ? node.children.map((c: any) =>
            typeof c?.text === "string" ? c.text : ""
          )
        : []
    )
    .join("\n")
    .trim();
  try {
    const o = JSON.parse(text);
    if (o && typeof o.start === "string" && typeof o.end === "string") return o;
  } catch {
    // ignore parse error
  }
  return null;
};

interface CmsHeader {
  title: string;
  logo: string;
  primary_color: string;
  secondary_color: string;
  locations: string[];
  categories: string[];
  quick_filters: string[];
  profile_menu: MenuItem[];
  seller_menu: MenuItem[];
  cart_label: string;
  search_placeholder: string;
  deals_label: string;
  deals_gradient: Gradient | null;
  show_login_register: boolean;
}

// ---------- Component ----------
const Header: React.FC = () => {
  const router = useRouter();
  const [{ cart, user }] = useStateValue() as any;

  const [loading, setLoading] = useState(true);
  const [cms, setCms] = useState<CmsHeader | null>(null);
  const [err, setErr] = useState("");

  const [search, setSearch] = useState("");
  const [locationOpen, setLocationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [delivery, setDelivery] = useState("");

  // Fetch Contentstack "header" singleton
  useEffect(() => {
    (async () => {
      try {
        const res = await Stack.ContentType("header").Query().toJSON().find();
        const entry = res?.[0]?.[0];
        if (!entry) throw new Error("No published `header` entry found.");

        const mapped: CmsHeader = {
          title: safeStr(entry.header_title || entry.title),
          logo: safeUrl(entry.logo?.url),
          primary_color: safeStr(entry.primary_color) || "#1a472a",
          secondary_color: safeStr(entry.secondary_color) || "#145a32",
          locations: Array.isArray(entry.locations)
            ? entry.locations.map(safeStr).filter(Boolean)
            : [],
          categories: getCategories(entry),
          quick_filters: getQuickFilters(entry),
          profile_menu: getProfileMenu(entry),
          seller_menu: getSellerMenu(entry),
          cart_label: safeStr(entry.cart_label) || "Cart",
          search_placeholder:
            safeStr(entry.search_placeholder) ||
            "Search farm tools, seeds, fertilizers...",
          deals_label: safeStr(entry.deals_label) || "🔥 Deals",
          deals_gradient: parseGradientFromJsonRte(entry.deals_gradient),
          show_login_register: !!entry.show_login_register,
        };

        setCms(mapped);
        if (mapped.locations.length) setDelivery(mapped.locations[0]);
      } catch (e: any) {
        console.error("Header CMS fetch error:", e);
        setErr(e.message || "Fetch failed");
        setCms(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const primary = cms?.primary_color || "#000";
  const secondary = cms?.secondary_color || "transparent";
  const brandTitle = cms?.title || "";
  const logoUrl = cms?.logo || "";

  const categories = useMemo(
    () => cms?.categories || [],
    [cms?.categories]
  );
  const quickFilters = useMemo(
    () => cms?.quick_filters || [],
    [cms?.quick_filters]
  );
  const locations = cms?.locations || [];

  const role = (user?.role || "").toString().trim().toLowerCase();
  const isSeller = role.includes("seller");

  const emit = (name: string, detail: any) =>
    typeof window !== "undefined" &&
    window.dispatchEvent(new CustomEvent(name, { detail }));

  const onSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    emit("farmcom:search", { query: q });
    if (typeof document !== "undefined") {
      document
        .querySelector(".row.row-cols-1.row-cols-md-3")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const onClickCategory = (cat: string) => {
    if (!cat) return;
    emit("farmcom:filter", { category: cat });
    if (typeof document !== "undefined") {
      document
        .querySelector(".row.row-cols-1.row-cols-md-3")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const onPickLocation = (loc: string) => {
    setDelivery(loc);
    setLocationOpen(false);
    emit("farmcom:location", { location: loc });
  };

  const onLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
    }
    emit("farmcom:logout", {});
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <nav
        className="navbar navbar-expand-lg navbar-dark"
        style={{ backgroundColor: "#000" }}
      >
        <div className="container-fluid px-4 text-white">Loading…</div>
      </nav>
    );
  }

  if (!cms) {
    return (
      <nav
        className="navbar navbar-expand-lg navbar-dark"
        style={{ backgroundColor: "#000" }}
      >
        <div className="container-fluid px-4">
          <span className="navbar-brand text-danger fw-semibold">
            Header unavailable
          </span>
          {err && <span className="text-warning ms-3">{err}</span>}
        </div>
      </nav>
    );
  }

  const gradient = cms.deals_gradient; // {start,end} or null

  return (
    <header className="sticky-top" style={{ zIndex: 1030 }}>
      {/* ===== Primary Navbar ===== */}
      <nav
        className="navbar navbar-expand-lg navbar-dark shadow-sm"
        style={{ backgroundColor: primary }}
      >
        <div className="container-fluid px-4">
          {/* Brand */}
          <Link
            href="/farmcom"
            className="navbar-brand text-white fw-bold d-flex align-items-center gap-2"
          >
            {logoUrl && (
              <img
                src={logoUrl}
                alt="logo"
                style={{
                  height: 28,
                  width: "auto",
                  objectFit: "contain",
                }}
              />
            )}
            <span>{brandTitle}</span>
          </Link>

          {/* Deliver To */}
          {locations.length > 0 && (
            <div
              className="position-relative d-none d-md-flex align-items-center ms-3"
              onMouseEnter={() => setLocationOpen(true)}
              onMouseLeave={() => setLocationOpen(false)}
            >
              <button
                type="button"
                className="btn btn-sm text-white d-flex align-items-center gap-2"
                style={{ background: "transparent" }}
              >
                <GeoAlt size={18} />
                <div className="text-start">
                  <small className="opacity-75">Deliver to</small>
                  <div className="fw-semibold">
                    {delivery || locations[0]}
                  </div>
                </div>
                <ChevronDown size={16} className="opacity-75" />
              </button>

              {locationOpen && (
                <div
                  className="dropdown-menu show mt-2 p-2 shadow"
                  style={{ minWidth: 220, borderRadius: 12 }}
                >
                  <div className="px-2 pb-2 small text-muted">
                    Choose your location
                  </div>
                  {locations.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      className="dropdown-item rounded"
                      onClick={() => onPickLocation(loc)}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Search */}
          <form
            className="d-flex flex-grow-1 mx-3 gap-2"
            style={{ maxWidth: 700 }}
            onSubmit={onSubmitSearch}
          >
            {categories.length > 0 && (
              <select
                className="form-select form-select-sm w-auto rounded"
                onChange={(e) =>
                  e.target.value && onClickCategory(e.target.value)
                }
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
            <input
              className="form-control rounded"
              placeholder={cms.search_placeholder || ""}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              className="btn btn-success px-3 fw-semibold"
              type="submit"
              title="Search"
            >
              🔍
            </button>
          </form>

          {/* Profile + Cart */}
          <div className="d-flex align-items-center text-white gap-3">
            {/* Profile */}
            <div
              className="position-relative"
              onMouseEnter={() => setProfileOpen(true)}
              onMouseLeave={() => setProfileOpen(false)}
            >
              <button
                type="button"
                className="btn btn-sm text-white d-flex flex-column align-items-center"
                style={{ background: "transparent" }}
              >
                <PersonCircle size={22} />
                <div style={{ fontSize: "0.8rem" }}>
                  {user ? user.name : "Guest"}
                </div>
              </button>

              {profileOpen && (
                <div
                  className="dropdown-menu dropdown-menu-end show mt-2 p-3 shadow"
                  style={{
                    minWidth: 240,
                    borderRadius: 12,
                    right: 0,
                    zIndex: 2000,
                    position: "absolute",
                  }}
                >
                  {user ? (
                    <>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <PersonCircle size={28} />
                        <div>
                          <div className="fw-semibold">
                            {user.name}
                          </div>
                          <div className="text-muted small">
                            {user.email || "No email"}
                          </div>
                        </div>
                      </div>
                      <div className="small text-muted mb-2">
                        Role:{" "}
                        <span className="text-success fw-semibold">
                          {user.role || "buyer"}
                        </span>
                      </div>
                      <div className="d-grid gap-2">
                        {(cms.profile_menu || []).map((m) => (
                          <Link
                            key={`${m.label}-${m.link}`}
                            href={m.link}
                            className="btn btn-outline-success btn-sm"
                            onClick={() => setProfileOpen(false)}
                          >
                            {m.label}
                          </Link>
                        ))}
                        {isSeller &&
                          (cms.seller_menu || []).map((m) => (
                            <Link
                              key={`${m.label}-${m.link}`}
                              href={m.link}
                              className="btn btn-outline-success btn-sm"
                              onClick={() => setProfileOpen(false)}
                            >
                              {m.label}
                            </Link>
                          ))}
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={onLogout}
                        >
                          Logout
                        </button>
                      </div>
                    </>
                  ) : cms.show_login_register ? (
                    <div className="d-grid gap-2">
                      <Link
                        href="/login"
                        className="btn btn-success btn-sm"
                        onClick={() => setProfileOpen(false)}
                      >
                        Login
                      </Link>
                      <Link
                        href="/signup"
                        className="btn btn-outline-success btn-sm"
                        onClick={() => setProfileOpen(false)}
                      >
                        Register
                      </Link>
                    </div>
                  ) : (
                    <div className="text-muted small px-1">
                      Sign-in disabled
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cart */}
            <Link
              href="/cart"
              className="text-white text-decoration-none position-relative"
              title="Cart"
            >
              <Cart size={26} />
              <span className="badge bg-success text-white position-absolute top-0 start-100 translate-middle rounded-pill">
                {cart?.length || 0}
              </span>
              <div style={{ fontSize: "0.8rem" }}>{cms.cart_label}</div>
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== Secondary Navigation ===== */}
      <div
        className="text-white py-2 shadow-sm"
        style={{
          backgroundColor: secondary,
          fontSize: "0.92rem",
          borderBottom: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        <div className="container d-flex flex-wrap gap-2">
          {(categories || []).map((c) => (
            <button
              key={c}
              type="button"
              className="btn btn-sm text-white border-0"
              style={{
                background: "rgba(255,255,255,0.12)",
                borderRadius: 20,
                padding: "6px 14px",
              }}
              onClick={() => onClickCategory(c)}
            >
              {c}
            </button>
          ))}

          {(quickFilters || []).map((label) => (
            <button
              key={label}
              className="btn btn-sm text-white border-0"
              style={{
                background: "rgba(255,255,255,0.12)",
                borderRadius: 20,
                padding: "6px 14px",
              }}
              onClick={() => emit("farmcom:filter", { tag: label })}
            >
              {label}
            </button>
          ))}

          {cms.deals_label && (
            <button
              type="button"
              className="btn btn-sm text-white border-0 ms-auto"
              style={{
                background:
                  gradient?.start && gradient?.end
                    ? `linear-gradient(90deg, ${gradient.start}, ${gradient.end})`
                    : "linear-gradient(90deg,#32a852,#28a745)",
                borderRadius: 20,
                padding: "6px 14px",
                boxShadow: "0 2px 8px rgba(0,0,0,.12)",
              }}
              onClick={() => emit("farmcom:filter", { tag: "deals" })}
            >
              {cms.deals_label}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
