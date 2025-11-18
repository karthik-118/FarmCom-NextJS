"use client";

import React, { useEffect, useState } from "react";
import Stack from "@/lib/contentstack"; // ✅ Next.js Contentstack config

const SUPPORT_EMAIL = "krushisamrudhhi@gmail.com";

interface FooterEntry {
  title?: string;
  ftitle?: string;
  description?: string;
  support_title?: string;
  support_text?: string;
  small_print?: string;
  [key: string]: any;
}

const Footer2: React.FC = () => {
  const [footer, setFooter] = useState<FooterEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const Query = Stack.ContentType("footer2").Query();
        const res = await Query.toJSON().find();
        const entries = (res?.[0] as FooterEntry[]) || [];
        if (mounted) setFooter(entries[0] || null);
      } catch (e) {
        console.warn("Footer2 fetch failed; using fallback.", e);
        if (mounted) setFooter(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSendMail = () => {
    const subject = encodeURIComponent("FarmCom Support Request");
    const body = encodeURIComponent(
      "Hi,\n\nI need help with...\n\n(Include details like order id, product link, screenshots, etc.)\n"
    );
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  const title = footer?.title || footer?.ftitle || "FarmCom";
  const description =
    footer?.description ||
    "Your trusted marketplace for farm tools, seeds, and more.";
  const supportTitle =
    footer?.support_title || "Customer Support";
  const supportText =
    footer?.support_text || "Email us and we’ll get back to you.";
  const smallPrint =
    footer?.small_print ||
    "Powered by Contentstack Visual Builder.";

  return (
    <footer id="footer" className="mt-auto">
      <div
        className="mt-4 pt-4"
        style={{
          background: "linear-gradient(90deg, #0f3d22, #145a32)",
          color: "#fff",
        }}
      >
        <div className="container py-4">
          <div className="row g-4 align-items-start">
            <div className="col-md-8">
              <h5 className="fw-bold mb-2">
                {loading ? "Loading…" : title}
              </h5>
              <p className="mb-2" style={{ opacity: 0.9 }}>
                {loading ? "Please wait…" : description}
              </p>
            </div>

            <div className="col-md-4">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h6 className="fw-bold mb-2">{supportTitle}</h6>
                  <p className="small text-muted mb-3">
                    {supportText}
                  </p>
                  <div className="d-grid">
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={handleSendMail}
                    >
                      ✉️ Email Support ({SUPPORT_EMAIL})
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr
            className="border-light my-4"
            style={{ opacity: 0.2 }}
          />

          <div className="d-flex flex-wrap justify-content-between align-items-center small">
            <div>
              © {new Date().getFullYear()} FarmCom. All rights
              reserved.
            </div>
            <div className="text-white-50">{smallPrint}</div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer2;
