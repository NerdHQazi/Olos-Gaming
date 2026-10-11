"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface BackToDashboardProps {
  label?: string;
  href?: string;
  className?: string;
}

export default function BackToDashboard({
  label = "Back to Dashboard",
  href = "/dashboard",
  className = "",
}: BackToDashboardProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white transition-all active:scale-95 ${className}`}
    >
      <ArrowLeft size={14} className="text-[#20ceee]" />
      <span>{label}</span>
    </Link>
  );
}
