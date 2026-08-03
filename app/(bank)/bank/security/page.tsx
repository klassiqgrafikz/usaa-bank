"use client";

import { isMockMode } from "@/lib/mock";
import { SecurityClient } from "./security-client";

export default function SecurityPage() {
  return <SecurityClient email={isMockMode() ? "demo@usaa-demo.com" : ""} />;
}