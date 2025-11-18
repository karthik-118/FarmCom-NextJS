// app/signup/page.tsx
"use client";

import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Stack from "@/lib/contentstack";
import Link from "next/link";
import Image from "next/image";

interface CmsSignupData {
  page_title?: string;
  page_description?: string;
  background_image?: { url?: string };
  logo?: { url?: string };
  button_text?: string;
  login_text?: string;
  login_link_text?: string;
  login_redirect_link?: string | { url?: string };
  [key: string]: any;
}

interface SignupFormData {
  name: string;
  email: string;
  password: string;
  role: string;
}

const SignupPage: React.FC = () => {
  const router = useRouter();
  const [cmsData, setCmsData] = useState<CmsSignupData>({});
  const [formData, setFormData] = useState<SignupFormData>({
    name: "",
    email: "",
    password: "",
    role: "buyer",
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchSignupData = async () => {
      try {
        const Query = Stack.ContentType("signup_page").Query();
        const result = await Query.toJSON().find();
        const entry = result?.[0]?.[0] as CmsSignupData;
        setCmsData(entry || {});
      } catch (error) {
        console.error("Error fetching signup page data:", error);
        setCmsData({});
      } finally {
        setLoading(false);
      }
    };
    fetchSignupData();
  }, []);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");

      localStorage.setItem("authToken", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      alert("Signup successful!");
      router.push("/farmcom");
    } catch (err: any) {
      console.error("Signup error:", err);
      setErrorMsg(err.message || "Signup failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center text-white mt-5">Loading...</div>;
  }

  const {
    page_title = "Signup Page",
    page_description = "Create your account by filling the details below.",
    background_image,
    logo,
    button_text = "Sign Up",
    login_text = "Already have an account?",
    login_link_text = "Login",
    login_redirect_link = "/login",
  } = cmsData;

  const backgroundUrl =
    (background_image as any)?.url || "/background.png"; // /public/background.png
  const logoUrl = (logo as any)?.url || "/logo.png";

  const loginHref =
    typeof login_redirect_link === "string"
      ? login_redirect_link
      : login_redirect_link?.url || "/login";

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
      {/* Dark overlay */}
      <div
        className="position-absolute w-100 h-100"
        style={{
          backgroundColor: "rgba(0,0,0,0.5)",
          top: 0,
          left: 0,
        }}
      ></div>

      <div
        className="position-relative d-flex flex-column align-items-center justify-content-center text-center px-3"
        style={{ zIndex: 1, maxWidth: "400px", width: "100%" }}
      >
        {/* Logo */}
        <div className="mb-4">
          <Image
            src={logoUrl}
            alt="App Logo"
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
            type="text"
            className="form-control mb-3"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your name"
            required
          />

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
            className="form-control mb-3"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
          />

          <select
            name="role"
            className="form-control mb-4"
            value={formData.role}
            onChange={handleChange}
            required
          >
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
          </select>

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
            {isSubmitting ? "Signing up..." : button_text}
          </button>

          <p className="text-white mt-3">
            {login_text}{" "}
            <Link
              href={loginHref}
              className="text-decoration-none fw-bold text-info"
            >
              {login_link_text}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
