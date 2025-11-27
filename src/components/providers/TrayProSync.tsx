"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { usePro } from "@/hooks";

export default function TrayProSync() {
  const { t } = useTranslation();
  const { isPro, isLoaded } = usePro();

  useEffect(() => {
    if (!isLoaded) return;

    const label = isPro ? t("tray.proActivated") : t("tray.activateLicense");
    invoke("sync_pro_status", { isPro, label });
  }, [isPro, isLoaded, t]);

  return null;
}
