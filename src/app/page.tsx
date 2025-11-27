"use client";

import dynamic from "next/dynamic";

const FloatingBar = dynamic(
  () =>
    import("@/components/floating-bar").then((mod) => ({ default: mod.FloatingBar })),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-transparent overflow-hidden flex items-center justify-center">
      <FloatingBar />
    </main>
  );
}
