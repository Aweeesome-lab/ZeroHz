"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

interface TrayLabels {
  show_window: string;
  session_history: string;
  usage: string;
  start_at_login: string;
  activate_license: string;
  language: string;
  check_for_updates: string;
  quit: string;
}

export default function TrayLanguageSync() {
  const { i18n, t } = useTranslation();

  // Function to update tray menu labels
  const updateTrayLabels = () => {
    const labels: TrayLabels = {
      show_window: t("tray.showWindow"),
      session_history: t("tray.sessionHistory"),
      usage: t("tray.usage"),
      start_at_login: t("tray.startAtLogin"),
      activate_license: t("tray.activateLicense"),
      language: t("tray.language"),
      check_for_updates: t("tray.checkForUpdates"),
      quit: t("tray.quit"),
    };
    invoke("update_tray_menu", { labels });
  };

  useEffect(() => {
    // Sync initial state to tray
    invoke("sync_language_tray", { lang: i18n.language });
    updateTrayLabels();

    // Listen for language changes from Tray
    let unlistenFn: (() => void) | undefined;
    let isMounted = true;

    listen<string>("change-language", (event) => {
      const newLang = event.payload;
      if (newLang !== i18n.language) {
        i18n.changeLanguage(newLang);
      }
    }).then((fn) => {
      if (isMounted) {
        unlistenFn = fn;
      } else {
        // Component unmounted before listener was set up
        fn();
      }
    });

    return () => {
      isMounted = false;
      unlistenFn?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync when language changes from within the app (e.g. if we add UI buttons later)
  useEffect(() => {
    invoke("sync_language_tray", { lang: i18n.language });
    updateTrayLabels();
  }, [i18n.language, t]);

  return null;
}
