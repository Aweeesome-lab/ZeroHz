"use client";

import { track } from "@vercel/analytics";
import { usePostHog } from "posthog-js/react";
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
  const posthog = usePostHog();

  return (
    <Link
      href={`/api/download?platform=${platform}`}
      className={className}
      onClick={() => {
        track("Download", { platform });
        posthog?.capture("download_clicked", { platform });
      }}
    >
      {children}
    </Link>
  );
}
