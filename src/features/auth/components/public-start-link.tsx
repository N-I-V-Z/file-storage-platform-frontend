"use client";

import Link from "next/link";
import { useAuth } from "../hooks/use-auth";

export function PublicStartLink({ label }: { label: string }) {
  const { user, pending } = useAuth();
  if (pending)
    return <span className="hero-action-placeholder" aria-hidden="true" />;
  return (
    <Link
      className="button button-primary"
      href={user ? "/dashboard" : "/register"}
    >
      {label} <span aria-hidden="true">↗</span>
    </Link>
  );
}
