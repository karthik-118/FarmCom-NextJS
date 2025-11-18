"use client";

import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Stack from "@/lib/contentstack";
import Image from "next/image";

interface CmsLoginData {
  page_title?: string;
  page_description?: string;
  background_image?: { url?: string };
  logo?: { url?: string };
  button_text?: string;
  signup_text?: string;
  signup_link_text?: string;
  signup_redirect_link?: string | { url?: string };
  [key: string]: any;
}

interface FormData {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [cmsData, setCmsData] = useState<CmsLoginData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchLoginPage = async () => {
      try {
        const Query = Stack.ContentType("login_page").Query();
        const result = await Query.toJSON().find();
        const entry = result?.[0]?.[0] as CmsLoginData;
        setCmsData(entry || {});
      } catch (error) {
        console.error("Contentstack fetch failed:", error);
        setCmsData({});
      } finally {
        setLoading(false);
      }
    };
    fetchLoginPage();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

 const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setErrorMsg("");
  setIsSubmitting(true);

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    // Read raw text first
    const text = await res.text();
    const contentType = res.headers.get("content-type") || "";

    let data: any = null;
    if (contentType.includes("application/json") && text) {
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.error("Failed to parse JSON from /api/auth/login:", parseErr);
      }
    } else {
      console.error("Non-JSON response from /api/auth/login:", text);
    }

    if (!res.ok) {
      const msg =
        data?.message ||
        `Login failed (status ${res.status} ${res.statusText})`;
      throw new Error(msg);
    }

    // ✅ Same behaviour as your MERN app
    localStorage.setItem("authToken", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    alert("Login successful!");
    router.push("/farmcom");
  } catch (err: any) {
    console.error("Login error:", err);
    setErrorMsg(err.message || "Login failed. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
};


  if (loading) {
    return <div className="text-center mt-5 text-white">Loading...</div>;
  }

  const {
    page_title = "Login",
    page_description = "Enter your account details to login.",
    background_image,
    logo,
    button_text = "Login",
    signup_text = "Don’t have an account?",
    signup_link_text = "Sign Up",
    signup_redirect_link = "/signup",
  } = cmsData || {};

  const backgroundUrl =
    (background_image as any)?.url || "/background.png"; // from /public
  const logoUrl = (logo as any)?.url || "/logo.png";

  const signupHref =
    typeof signup_redirect_link === "string"
      ? signup_redirect_link
      : signup_redirect_link?.url || "/signup";

  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center vh-100"
      style={{
        backgroundImage: `url(${backgroundUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
      }}
    >
      <div
        className="position-absolute w-100 h-100"
        style={{ backgroundColor: "rgba(0,0,0,0.5)", top: 0, left: 0 }}
      ></div>

      <div
        className="position-relative d-flex flex-column align-items-center justify-content-center text-center px-3"
        style={{ zIndex: 1, maxWidth: "400px", width: "100%" }}
      >
        {/* Logo */}
        <div className="mb-4">
          <Image
            src={logoUrl}
            alt="Krushi Samrudhhi"
            width={80}
            height={80}
            style={{
              objectFit: "cover",
              borderRadius: "50%",
              border: "2px solid #28a745",
            }}
          />
        </div>

        <h1 className="display-4 mb-3 text-white">{page_title}</h1>
        <p className="lead text-white mb-4">{page_description}</p>

        <form
          className="d-flex flex-column w-100 p-4 rounded"
          style={{
            backgroundColor: "rgba(255,255,255,0.2)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.3)",
          }}
          onSubmit={handleSubmit}
        >
          <input
            type="email"
            className="form-control mb-3"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
          />
          <input
            type="password"
            className="form-control mb-4"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
          />

          {errorMsg && (
            <div className="alert alert-danger py-2">{errorMsg}</div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn fw-bold text-white"
            style={{
              background: "linear-gradient(45deg, #0d6efd, #28a745)",
              transition: "0.3s",
              opacity: isSubmitting ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.background =
                "linear-gradient(45deg, #28a745, #0d6efd)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.background =
                "linear-gradient(45deg, #0d6efd, #28a745)";
            }}
          >
            {isSubmitting ? "Logging in..." : button_text}
          </button>

          <p className="text-white mt-3">
            {signup_text}{" "}
            <span
              onClick={() => router.push(signupHref)}
              className="text-decoration-none fw-bold text-info"
              role="button"
              style={{ cursor: "pointer" }}
            >
              {signup_link_text}
            </span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
