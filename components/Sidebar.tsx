"use client";

import React, { useEffect, useState, ChangeEvent } from "react";
import Stack from "@/lib/contentstack";

interface SidebarProps {
  onFilterChange?: (filters: {
    category: string;
    sort: string;
    minPrice: string;
    maxPrice: string;
  }) => void;
}

interface CmsSidebar {
  header_text: string;
  categories: string[];
  sort_options: { label: string; value: string }[];
  min_placeholder: string;
  max_placeholder: string;
  apply_label: string;
  reset_label: string;
  bg_grad_start: string;
  bg_grad_end: string;
  text_color: string;
  accent_color: string;
  show_apply: boolean;
  show_reset: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    category: "",
    sort: "",
    minPrice: "",
    maxPrice: "",
  });
  const [cms, setCms] = useState<CmsSidebar | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSidebar = async () => {
      try {
        const Query = Stack.ContentType("sidebar").Query().toJSON();
        const res = await Query.find();
        const entry = res?.[0]?.[0];
        if (!entry) throw new Error("No Sidebar entry found");

        const mapped: CmsSidebar = {
          header_text: entry.header_text || "🌿 Filter & Sort",
          categories: entry.categories?.category_name || [],
          sort_options:
            entry.sort_options?.map((s: any) => ({
              label: s.label,
              value: s.value,
            })) || [],
          min_placeholder: entry.min_price_placeholder || "Min",
          max_placeholder: entry.max_price_placeholder || "Max",
          apply_label: entry.apply_button_label || "Apply Filters",
          reset_label: entry.reset_button_label || "Reset Filters",
          bg_grad_start: entry.bg_grad_start || "#1a472a",
          bg_grad_end: entry.bg_grad_end || "#2e8b57",
          text_color: entry.text_color || "#ffffff",
          accent_color: entry.accent_color || "#1a472a",
          show_apply: entry.show_apply_button ?? true,
          show_reset: entry.show_reset_button ?? true,
        };

        setCms(mapped);
      } catch (err) {
        console.error("Sidebar CMS fetch error:", err);
        setCms(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSidebar();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const newFilters = { ...filters, [e.target.name]: e.target.value };
    setFilters(newFilters);
    if (onFilterChange) onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      category: "",
      sort: "",
      minPrice: "",
      maxPrice: "",
    };
    setFilters(resetFilters);
    if (onFilterChange) onFilterChange(resetFilters);
  };

  if (loading)
    return (
      <aside className="col-md-3 mb-4 mb-md-0 text-center text-white p-3 bg-dark rounded">
        Loading Sidebar...
      </aside>
    );

  if (!cms)
    return (
      <aside className="col-md-3 mb-4 mb-md-0 text-center text-white p-3 bg-danger rounded">
        Sidebar not found
      </aside>
    );

  return (
    <aside
      className="col-md-3 mb-4 mb-md-0"
      style={{
        background: `linear-gradient(180deg, ${cms.bg_grad_start} 0%, ${cms.bg_grad_end} 100%)`,
        borderRadius: "18px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        color: cms.text_color,
        padding: "20px",
      }}
    >
      <h5 className="fw-bold mb-3 text-center">{cms.header_text}</h5>

      {/* Category Filter */}
      <div className="mb-3">
        <label className="form-label fw-semibold">Category</label>
        <select
          className="form-select border-0 shadow-sm"
          name="category"
          value={filters.category}
          onChange={handleChange}
          style={{
            borderRadius: "10px",
            backgroundColor: "#f8fff8",
            color: cms.accent_color,
          }}
        >
          <option value="">All Categories</option>
          {cms.categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Sort Filter */}
      <div className="mb-3">
        <label className="form-label fw-semibold">Sort By</label>
        <select
          className="form-select border-0 shadow-sm"
          name="sort"
          value={filters.sort}
          onChange={handleChange}
          style={{
            borderRadius: "10px",
            backgroundColor: "#f8fff8",
            color: cms.accent_color,
          }}
        >
          {cms.sort_options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div className="mb-3">
        <label className="form-label fw-semibold">Price Range (₹)</label>
        <div className="d-flex align-items-center gap-2">
          <input
            type="number"
            className="form-control border-0 shadow-sm"
            name="minPrice"
            value={filters.minPrice}
            onChange={handleChange}
            placeholder={cms.min_placeholder}
            style={{
              backgroundColor: "#f8fff8",
              borderRadius: "8px",
              width: "50%",
              color: cms.accent_color,
            }}
          />
          <input
            type="number"
            className="form-control border-0 shadow-sm"
            name="maxPrice"
            value={filters.maxPrice}
            onChange={handleChange}
            placeholder={cms.max_placeholder}
            style={{
              backgroundColor: "#f8fff8",
              borderRadius: "8px",
              width: "50%",
              color: cms.accent_color,
            }}
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="d-flex flex-column gap-2 mt-4">
        {cms.show_apply && (
          <button
            onClick={() => onFilterChange && onFilterChange(filters)}
            className="btn btn-light fw-bold shadow-sm"
            style={{
              borderRadius: "10px",
              color: cms.accent_color,
            }}
          >
            {cms.apply_label}
          </button>
        )}

        {cms.show_reset && (
          <button
            onClick={handleReset}
            className="btn btn-outline-light fw-semibold shadow-sm"
            style={{ borderRadius: "10px" }}
          >
            {cms.reset_label}
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
