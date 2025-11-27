"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export default function TrayLanguageSync() {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Sync initial state to tray
    invoke("sync_language_tray", { lang: i18n.language });

    // Listen for language changes from Tray
    const unlisten = listen<string>("change-language", (event) => {
      const newLang = event.payload;
      if (newLang !== i18n.language) {
        i18n.changeLanguage(newLang);
      }
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, [i18n]);

  // Sync when language changes from within the app (e.g. if we add UI buttons later)
  useEffect(() => {
    invoke("sync_language_tray", { lang: i18n.language });
  }, [i18n.language]);

  return null;
}
