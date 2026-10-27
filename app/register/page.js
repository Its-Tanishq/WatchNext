"use client";

import { Suspense } from "react";
import AuthPage from "../components/AuthPage";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0c10]" />}>
      <AuthPage initialMode="register" />
    </Suspense>
  );
}
