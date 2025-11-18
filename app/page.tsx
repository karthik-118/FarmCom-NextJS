"use client";

import React from "react";
import Link from "next/link";


export default function Home() {
  return (
    <>
     

      {/* HERO SECTION */}
      <section
        className="text-center text-white d-flex align-items-center justify-content-center"
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, #0f5132 0%, #198754 50%, #20c997 100%)",
          paddingTop: "80px",
        }}
      >
        <div className="container">
          <h1 className="display-3 fw-bold mb-3">
            FarmCom – Direct From Farmers To You 🌾
          </h1>
          <p className="lead mb-4">
            Buy & Sell Seeds, Tools, Fertilizers and Fresh Produce with complete
            transparency. No middlemen. Fair pricing.
          </p>

          <div className="d-flex flex-wrap justify-content-center gap-3 mt-4">
            <Link
              href="/farmcom"
              className="btn btn-light btn-lg fw-bold px-5 py-3 shadow"
            >
              🚀 Get Started
            </Link>

            <Link
              href="/login"
              className="btn btn-outline-light btn-lg fw-bold px-5 py-3"
            >
              Login
            </Link>

            <Link
              href="/signup"
              className="btn btn-outline-warning btn-lg fw-bold px-5 py-3"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-5 bg-light">
        <div className="container">
          <h2 className="text-center fw-bold mb-4">Popular Categories</h2>

          <div className="row g-4">
            {[
              ["🌱 Seeds & Saplings", "seeds"],
              ["🛠️ Farm Tools", "tools"],
              ["🧪 Fertilizers", "fertilizers"],
              ["🚿 Irrigation", "irrigation"],
              ["🛡️ Pesticides", "pesticides"],
              ["📦 Storage", "storage"],
            ].map(([label, slug], i) => (
              <div className="col-6 col-md-4 col-lg-2" key={i}>
                <div
                  className="card shadow-sm border-0 text-center p-3 h-100 category-card"
                  style={{ borderRadius: "14px" }}
                >
                  <h3 className="fw-bold">{label.split(" ")[0]}</h3>
                  <p className="small text-muted mb-3">{label}</p>
                  <Link
                    href="/farmcom"
                    className="btn btn-sm btn-success fw-semibold"
                  >
                    Explore →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-5">
        <div className="container">
          <h2 className="text-center fw-bold mb-5">
            Why Choose <span className="text-success">FarmCom</span>?
          </h2>

          <div className="row g-4">
            {[
              ["💸 No Middlemen", "Farmers earn more, buyers save more."],
              ["🔒 Secure Payments", "Fast, transparent & protected checkout."],
              ["🚚 Easy Delivery", "Nearby sellers deliver faster."],
            ].map(([title, desc], idx) => (
              <div className="col-md-4" key={idx}>
                <div
                  className="card border-0 shadow-sm p-4 h-100 text-center"
                  style={{ borderRadius: "16px" }}
                >
                  <h1>{title.split(" ")[0]}</h1>
                  <h5 className="fw-bold mt-3">{title}</h5>
                  <p className="text-muted mt-2">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SELLER CTA */}
      <section
        className="py-5 text-white"
        style={{
          background: "linear-gradient(135deg, #0d6efd 0%, #6610f2 100%)",
        }}
      >
        <div className="container text-center">
          <h2 className="fw-bold">Are You a Farmer or Seller?</h2>
          <p className="lead mb-4">
            Join FarmCom and sell directly to customers with transparent pricing.
          </p>

          <Link
            href="/seller"
            className="btn btn-warning btn-lg px-5 py-3 fw-bold shadow"
          >
            Start Selling
          </Link>
        </div>
      </section>

    </>
  );
}
