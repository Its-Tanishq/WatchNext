"use client";

import { Suspense } from "react";
import AuthPage from "../components/AuthPage";

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0c10]" />}>
      <AuthPage initialMode="login" />
    </Suspense>
  );
}
