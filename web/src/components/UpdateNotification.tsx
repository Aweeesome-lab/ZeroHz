"use client";

import { useEffect, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { X, Download, RefreshCw } from "lucide-react";
import { relaunch } from "@tauri-apps/plugin-process";

export function UpdateNotification() {
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [version, setVersion] = useState<string>("");
  const [body, setBody] = useState<string>("");
  const [downloading, setDownloading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<boolean>(false);

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const update = await check();
        if (update && update.available) {
          setVersion(update.version);
          setBody(update.body || "");
          setUpdateAvailable(true);
        }
      } catch (err) {
        // Silent failure for auto-check
        console.error("Failed to check for updates:", err);
      }
    };

    checkForUpdates();
  }, []);

  const handleUpdate = async () => {
    setDownloading(true);
    setError(null);
    try {
      const update = await check();
      if (update) {
        await update.downloadAndInstall();
        setDownloaded(true);
        setDownloading(false);
        // Ask to restart
        await relaunch();
      }
    } catch (err) {
      console.error("Failed to install update:", err);
      setError("Failed to install update. Please try again.");
      setDownloading(false);
    }
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-full text-blue-600 dark:text-blue-400">
            <RefreshCw size={16} />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              Update Available
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Version {version}
            </p>
          </div>
        </div>
        <button
          onClick={() => setUpdateAvailable(false)}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {body && (
        <div className="mb-4 text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-lg max-h-24 overflow-y-auto">
          {body}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 mb-3 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-900/30">
          {error}
        </p>
      )}

      <button
        onClick={handleUpdate}
        disabled={downloading || downloaded}
        className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {downloading ? (
          <>
            <RefreshCw size={14} className="animate-spin" />
            Downloading & Installing...
          </>
        ) : downloaded ? (
          "Restarting..."
        ) : (
          <>
            <Download size={14} />
            Update to v{version}
          </>
        )}
      </button>
    </div>
  );
}
