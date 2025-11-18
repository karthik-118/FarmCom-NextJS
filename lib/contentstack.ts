// lib/contentstack.ts
import Contentstack from "contentstack";
import ContentstackLivePreview from "@contentstack/live-preview-utils";

const isPreview = process.env.NEXT_PUBLIC_USE_PREVIEW === "true";

const Stack = Contentstack.Stack({
  api_key: process.env.NEXT_PUBLIC_API_KEY as string,
  delivery_token: isPreview
    ? (process.env.NEXT_PUBLIC_PREVIEW_TOKEN as string)
    : (process.env.NEXT_PUBLIC_DELIVERY_TOKEN as string),
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT as string,
  region:
    process.env.NEXT_PUBLIC_REGION === "us"
      ? Contentstack.Region.US
      : Contentstack.Region.EU,
  live_preview: {
    enable: isPreview,
    preview_token: process.env.NEXT_PUBLIC_PREVIEW_TOKEN as string,
    host: "rest-preview.contentstack.com",
  },
});

// ✅ Only run Visual Builder in the browser
if (typeof window !== "undefined" && isPreview) {
  ContentstackLivePreview.init({
    stackDetails: {
      apiKey: process.env.NEXT_PUBLIC_API_KEY as string,
      environment: process.env.NEXT_PUBLIC_ENVIRONMENT as string,
    },
    mode: "builder",
    enable: true,
    ssr: false,
    stackSdk: Stack,
    clientUrlParams: {
      host: "app.contentstack.com",
    },
    debug: false,
  });
}

export default Stack;
