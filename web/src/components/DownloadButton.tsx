"use client";

import { track } from "@vercel/analytics";
import Link from "next/link";
import { ReactNode } from "react";

interface DownloadButtonProps {
  platform: "mac" | "win";
  children: ReactNode;
  className?: string;
}

export default function DownloadButton({
  platform,
  children,
  className,
}: DownloadButtonProps) {
  return (
    <Link
      href={`/api/download?platform=${platform}`}
      className={className}
      onClick={() => {
        track("Download", { platform });
      }}
    >
      {children}
    </Link>
  );
}
