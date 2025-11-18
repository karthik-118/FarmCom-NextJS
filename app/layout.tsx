// app/layout.tsx
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import React from "react";
import { StateProvider } from "@/context/StateProvider";

export const metadata = {
  title: "FarmCom",
  description: "FarmCom platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <StateProvider>{children}</StateProvider>
      </body>
    </html>
  );
}
