"use client";

import React, { useState } from "react";
import { useStateValue } from "@/context/StateProvider";

interface Product {
  _id: string;
  name?: string;
  description?: any; // can be string (Mongo) OR JSON (Contentstack)
  category?: string;
  price: number;
  imageUrl?: string;
  averageRating?: number;
  rating?: number;
  ratingCount?: number;
}

// --- helper: convert Contentstack JSON RTE -> plain text ---
const nodeToText = (node: any): string => {
  if (!node) return "";
  if (typeof node.text === "string") return node.text;
  if (Array.isArray(node.children)) {
    return node.children.map(nodeToText).join(" ");
  }
  return "";
};

const getDescriptionText = (desc: any): string => {
  if (!desc) return "";
  // normal Mongo string
  if (typeof desc === "string") return desc;

  // sometimes Contentstack returns { type: "doc", children: [...] }
  if (typeof desc === "object") return nodeToText(desc);

  // weird cases (array root, etc.)
  if (Array.isArray(desc)) return desc.map(nodeToText).join(" ");

  return "";
};

const ProductCard = ({ product }: { product: Product }) => {
  const [, dispatch] = useStateValue() as any;
  const [showDetails, setShowDetails] = useState(false);

  const ratingAvg =
    typeof product.averageRating === "number"
      ? product.averageRating
      : typeof product.rating === "number"
      ? product.rating
      : null;

  const ratingCount =
    typeof product.ratingCount === "number"
      ? product.ratingCount
      : ratingAvg
      ? 1
      : 0;

  const addToCart = () =>
    dispatch({ type: "ADD_TO_CART", item: product });

  const imageSrc =
    product.imageUrl ||
    "https://via.placeholder.com/300x200?text=No+Image";

  const fullDescription = getDescriptionText(product.description);
  const shortDescription =
    fullDescription.length > 60
      ? fullDescription.slice(0, 60) + "..."
      : fullDescription || "No description available.";

  const RatingStars = () => {
    if (!ratingAvg || ratingCount === 0) return null;
    const rounded = Math.round(ratingAvg);
    return (
      <div
        style={{ color: "#f5b50a", fontSize: "1.1rem" }}
        title={`${ratingAvg.toFixed(1)} / 5 (${ratingCount})`}
      >
        {"⭐".repeat(rounded) + "☆".repeat(5 - rounded)}
      </div>
    );
  };

  return (
    <>
      {/* ===== Product Card ===== */}
      <div
        className="card shadow-sm h-100 border-0"
        style={{
          borderRadius: "16px",
          cursor: "pointer",
          backgroundColor: "#f9fff8",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
        }}
        onClick={() => setShowDetails(true)}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.05)";
          e.currentTarget.style.boxShadow =
            "0 8px 24px rgba(0, 128, 0, 0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow =
            "0 4px 10px rgba(0,0,0,0.1)";
        }}
      >
        <img
          src={imageSrc}
          alt={product.name}
          className="card-img-top"
          style={{
            height: "200px",
            objectFit: "cover",
            borderTopLeftRadius: "16px",
            borderTopRightRadius: "16px",
          }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "https://via.placeholder.com/300x200?text=No+Image";
          }}
        />

        <div className="card-body text-center">
          <h5 className="fw-bold">{product.name}</h5>
          <p className="text-muted small mb-1">
            {product.category || "Uncategorized"}
          </p>

          <RatingStars />

          <p
            className="text-secondary small mb-2"
            style={{
              minHeight: "45px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {shortDescription}
          </p>

          <p className="fw-bold text-success fs-5 mb-2">
            ₹{product.price}
          </p>

          <button
            className="btn btn-outline-success w-100 fw-bold"
            style={{ borderRadius: "8px" }}
            onClick={(e) => {
              e.stopPropagation();
              addToCart();
            }}
          >
            Add to Cart 🛒
          </button>
        </div>
      </div>

      {/* ===== Modal with full description ===== */}
      {showDetails && (
        <>
          <div
            className="modal fade show"
            style={{
              display: "block",
              backgroundColor: "rgba(0,0,0,0.5)",
              zIndex: 1050,
            }}
          >
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content rounded-4 shadow-lg border-success border-2">
                <div className="modal-header bg-success text-white">
                  <h5 className="modal-title fw-bold">
                    {product.name}
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowDetails(false)}
                  />
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 text-center">
                      <img
                        src={imageSrc}
                        alt={product.name}
                        className="img-fluid rounded mb-3"
                        style={{
                          maxHeight: "300px",
                          objectFit: "cover",
                        }}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "https://via.placeholder.com/300x200?text=No+Image";
                        }}
                      />
                      <div
                        style={{
                          color: "#f5b50a",
                          fontSize: "1.2rem",
                        }}
                      >
                        <RatingStars />
                      </div>
                      <p className="fw-bold text-success fs-5 mt-2">
                        ₹{product.price}
                      </p>
                    </div>
                    <div className="col-md-6">
                      <h6 className="fw-bold text-success mb-2">
                        Category: {product.category || "Uncategorized"}
                      </h6>
                      <p className="text-secondary">
                        {fullDescription || "No description available."}
                      </p>
                      <button
                        className="btn btn-success w-100 fw-bold mt-3"
                        onClick={() => {
                          addToCart();
                          setShowDetails(false);
                        }}
                      >
                        Add to Cart 🛒
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Backdrop */}
          <div
            className="modal-backdrop fade show"
            style={{ zIndex: 1040 }}
            onClick={() => setShowDetails(false)}
          />
        </>
      )}
    </>
  );
};

export default ProductCard;
