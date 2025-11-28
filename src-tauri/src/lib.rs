use std::sync::Mutex;
use tauri::{
  menu::{Menu, MenuItem, MenuItemBuilder, PredefinedMenuItem, CheckMenuItemBuilder, CheckMenuItem, Submenu},
  tray::TrayIconBuilder,
  Emitter, Manager, PhysicalPosition, Runtime, Wry,
};
use tauri_plugin_autostart::ManagerExt;
use tauri_plugin_updater::UpdaterExt;
use tauri_plugin_process::init as process_init;

#[derive(Clone)]
enum UpdateState {
  Checking,
  Available(String),
  Latest(String),
  Failed,
}

struct TrayMenuState<R: Runtime> {
  ko: CheckMenuItem<R>,
  en: CheckMenuItem<R>,
  show_window: CheckMenuItem<R>,
  session_history: MenuItem<R>,
  usage: MenuItem<R>,
  autostart: CheckMenuItem<R>,
  activate_license: MenuItem<R>,
  language_submenu: Submenu<R>,
  check_update: MenuItem<R>,
  update_status: MenuItem<R>,
  version_item: MenuItem<R>,
  quit: MenuItem<R>,
  current_lang: Mutex<String>,
  update_state: Mutex<UpdateState>,
  version_str: String,
}

#[tauri::command]
fn sync_language_tray<R: Runtime>(_app: tauri::AppHandle<R>, state: tauri::State<TrayMenuState<R>>, lang: String) {
  let _ = state.ko.set_checked(lang == "ko");
  let _ = state.en.set_checked(lang == "en");
  let current_lang = {
    let mut guard = state.current_lang.lock().unwrap_or_else(|_| panic!("current_lang poisoned"));
    *guard = lang;
    guard.clone()
  };

  // Localize version label
  let version_label = if current_lang.as_str() == "ko" {
    format!("버전 {}", state.version_str)
  } else {
    format!("Version {}", state.version_str)
  };
  let _ = state.version_item.set_text(&version_label);

  // Re-apply update status for new language (avoid double-locking)
  if let Some(st) = state.update_state.lock().ok().map(|s| s.clone()) {
    let locale = get_update_locale(&current_lang);
    apply_update_state(&state, &locale, st);
  }
}

#[derive(serde::Deserialize)]
struct TrayLabels {
  show_window: String,
  session_history: String,
  usage: String,
  start_at_login: String,
  activate_license: String,
  language: String,
  check_for_updates: String,
  quit: String,
}

#[tauri::command]
fn update_tray_menu<R: Runtime>(_app: tauri::AppHandle<R>, state: tauri::State<TrayMenuState<R>>, labels: TrayLabels) {
  let _ = state.show_window.set_text(&labels.show_window);
  let _ = state.session_history.set_text(&labels.session_history);
  let _ = state.usage.set_text(&labels.usage);
  let _ = state.autostart.set_text(&labels.start_at_login);
  let _ = state.activate_license.set_text(&labels.activate_license);
  let _ = state.language_submenu.set_text(&labels.language);
  let _ = state.check_update.set_text(&labels.check_for_updates);
  let _ = state.quit.set_text(&labels.quit);
}

#[tauri::command]
fn sync_pro_status<R: Runtime>(_app: tauri::AppHandle<R>, state: tauri::State<TrayMenuState<R>>, is_pro: bool, label: String) {
  let _ = state.activate_license.set_text(&label);
  let _ = state.activate_license.set_enabled(!is_pro);
}

struct UpdateLocale<'a> {
  title_available: &'a str,
  message_available: &'a str,
  button_install: &'a str,
  button_later: &'a str,
  title_ready: &'a str,
  message_ready: &'a str,
  title_error_download: &'a str,
  message_error_download: &'a str,
  title_error_check: &'a str,
  message_error_check: &'a str,
  title_no_update: &'a str,
  message_no_update: &'a str,
  title_init_error: &'a str,
  message_init_error: &'a str,
  status_checking: &'a str,
  status_available: &'a str,
  status_latest: &'a str,
  status_failed: &'a str,
  install_menu_label: &'a str,
  check_menu_label: &'a str,
  retry_menu_label: &'a str,
}

fn get_update_locale(lang: &str) -> UpdateLocale<'static> {
  match lang {
    "ko" => UpdateLocale {
      title_available: "업데이트 가능",
      message_available: "새 버전 {version}이 준비되었습니다. 지금 다운로드하고 설치할까요?",
      button_install: "설치",
      button_later: "나중에",
      title_ready: "업데이트 완료",
      message_ready: "업데이트가 설치되었습니다. ZeroHz를 다시 시작합니다.",
      title_error_download: "업데이트 오류",
      message_error_download: "업데이트 다운로드/설치에 실패했습니다. 다시 시도해 주세요.",
      title_error_check: "업데이트 확인 실패",
      message_error_check: "업데이트 확인에 실패했습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.",
      title_no_update: "최신 버전입니다",
      message_no_update: "이미 최신 버전(v{version})을 사용 중입니다.",
      title_init_error: "업데이트 초기화 실패",
      message_init_error: "업데이트 모듈을 초기화하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      status_checking: "… 업데이트 확인 중",
      status_available: "⬆ 업데이트 가능: v{version}",
      status_latest: "✓ 최신 버전",
      status_failed: "⚠ 업데이트 확인 실패",
      install_menu_label: "업데이트 설치 (v{version})",
      check_menu_label: "업데이트 확인",
      retry_menu_label: "업데이트 다시 확인",
    },
    _ => UpdateLocale {
      title_available: "Update Available",
      message_available: "New version {version} is available. Download and install now?",
      button_install: "Install",
      button_later: "Later",
      title_ready: "Update Ready",
      message_ready: "Update installed. ZeroHz will restart to apply it.",
      title_error_download: "Update Error",
      message_error_download: "Failed to download or install the update. Please try again.",
      title_error_check: "Update Check Failed",
      message_error_check: "Failed to check for updates. Please check your connection and try again.",
      title_no_update: "No Updates Available",
      message_no_update: "You are already running the latest version (v{version}).",
      title_init_error: "Updater Error",
      message_init_error: "Failed to initialize the updater. Please try again later.",
      status_checking: "… Checking for updates",
      status_available: "⬆ Update available: v{version}",
      status_latest: "✓ Up to date",
      status_failed: "⚠ Update check failed",
      install_menu_label: "Install update (v{version})",
      check_menu_label: "Check for Updates",
      retry_menu_label: "Retry update check",
    },
  }
}

fn apply_update_state<R: Runtime>(state: &TrayMenuState<R>, locale: &UpdateLocale<'_>, new_state: UpdateState) {
  if let Ok(mut st) = state.update_state.lock() {
    *st = new_state.clone();
  }

  match new_state {
    UpdateState::Checking => {
      let _ = state.update_status.set_text(locale.status_checking);
      let _ = state.check_update.set_text(locale.check_menu_label);
    }
    UpdateState::Available(v) => {
      let _ = state.update_status.set_text(locale.status_available.replace("{version}", &v));
      let _ = state.check_update.set_text(locale.install_menu_label.replace("{version}", &v));
    }
    UpdateState::Latest(v) => {
      let _ = state.update_status.set_text(locale.status_latest.replace("{version}", &v));
      let _ = state.check_update.set_text(locale.check_menu_label);
    }
    UpdateState::Failed => {
      let _ = state.update_status.set_text(locale.status_failed);
      let _ = state.check_update.set_text(locale.retry_menu_label);
    }
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_autostart::init(
      tauri_plugin_autostart::MacosLauncher::LaunchAgent,
      None, // No additional arguments
    ))
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_dialog::init())
    .plugin(process_init())
    .plugin(tauri_plugin_store::Builder::default().build())
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_posthog::init(
      tauri_plugin_posthog::PostHogConfig {
          api_key: option_env!("NEXT_PUBLIC_POSTHOG_KEY").unwrap_or("").to_string(),
          api_host: option_env!("NEXT_PUBLIC_POSTHOG_HOST").unwrap_or("https://app.posthog.com").to_string(),
          options: None,
      }
    ))
    .invoke_handler(tauri::generate_handler![sync_language_tray, update_tray_menu, sync_pro_status])
    .setup(|app| {
      let window = app.get_webview_window("main").unwrap();

      // Position window at top center of the screen
      if let Some(monitor) = window.current_monitor().ok().flatten() {
        let monitor_size = monitor.size();
        let monitor_position = monitor.position();
        let window_size = window.outer_size().unwrap();
        
        // Calculate center X position
        let x = monitor_position.x + (monitor_size.width as i32 - window_size.width as i32) / 2;
        
        // Position at top of screen, below status bar (25px on macOS)
        #[cfg(target_os = "macos")]
        let y = monitor_position.y + 25;
        
        #[cfg(not(target_os = "macos"))]
        let y = monitor_position.y + 10;
        
        let _ = window.set_position(PhysicalPosition::new(x, y));
      }

      #[cfg(target_os = "macos")]
      {
        use objc2_app_kit::NSColor;

        // Set completely transparent background
        unsafe {
          use objc2::{msg_send, runtime::AnyObject};
          
          let ns_window = window.ns_window().unwrap() as *mut AnyObject;
          let bg_color = NSColor::colorWithRed_green_blue_alpha(0.0, 0.0, 0.0, 0.0);
          let _: () = msg_send![ns_window, setBackgroundColor: &*bg_color];
          let _: () = msg_send![ns_window, setOpaque: false];
          
          // Set corner radius for rounded window
          let content_view: *mut AnyObject = msg_send![ns_window, contentView];
          // Enable layer-backing for the content view
          let _: () = msg_send![content_view, setWantsLayer: true];
          let layer: *mut AnyObject = msg_send![content_view, layer];
          let corner_radius: f64 = 16.0;
          let _: () = msg_send![layer, setCornerRadius: corner_radius];
          let _: () = msg_send![layer, setMasksToBounds: true];
          
          // Make window appear on all desktop spaces (Spaces)
          // NSWindowCollectionBehaviorCanJoinAllSpaces (1)
          // NSWindowCollectionBehaviorStationary (16) - stays on screen when switching spaces
          // NSWindowCollectionBehaviorFullScreenAuxiliary (256) - allows showing over fullscreen apps
          let behavior: u64 = 1 | 16 | 256;
          let _: () = msg_send![ns_window, setCollectionBehavior: behavior];
        }
      }

      #[cfg(target_os = "windows")]
      {
        // Ensure decorations are off and shadow is removed to prevent artifacts
        let _ = window.set_decorations(false);
        let _ = window.set_shadow(false);
      }

      // Get app version from Cargo.toml
      let version = env!("CARGO_PKG_VERSION");
      let version_text = format!("Version {}", version);

      // Check current autostart status
      let autostart_manager = app.autolaunch();
      let is_enabled = autostart_manager.is_enabled().unwrap_or(false);

      // Build menu items - organized by importance (Raycast style)

      // === Primary Actions (Most Used) ===
      let show_window_item = CheckMenuItemBuilder::new("Show Window")
        .checked(true)
        .build(app)?;

      let session_history_item = MenuItemBuilder::new("Session History")
        .build(app)?;

      let usage_item = MenuItemBuilder::new("Usage")
        .build(app)?;

      let separator1 = PredefinedMenuItem::separator(app)?;

      // === Settings ===
      let autostart_item = CheckMenuItemBuilder::new("Start at Login")
        .checked(is_enabled)
        .build(app)?;

      let activate_license_item = MenuItemBuilder::new("Activate License")
        .build(app)?;

      // Language Submenu
      let lang_ko_item = CheckMenuItemBuilder::with_id("lang_ko", "한국어")
        .build(app)?;
      let lang_en_item = CheckMenuItemBuilder::with_id("lang_en", "English")
        .build(app)?;

      let language_submenu = tauri::menu::SubmenuBuilder::new(app, "Language")
        .items(&[&lang_ko_item, &lang_en_item])
        .build()?;

      let separator2 = PredefinedMenuItem::separator(app)?;

      // === App Info ===
      let version_item = MenuItemBuilder::new(&version_text)
        .enabled(false)
        .build(app)?;

      let check_update_item = MenuItemBuilder::new("Check for Updates")
        .build(app)?;
      let update_status_item = MenuItemBuilder::new("Update status")
        .enabled(false)
        .build(app)?;

      let separator3 = PredefinedMenuItem::separator(app)?;

      // === Exit ===
      let quit_item = MenuItemBuilder::new("Quit")
        .build(app)?;

      // Store menu item IDs for use in the closure
      let check_update_id = check_update_item.id().clone();
      let autostart_id = autostart_item.id().clone();
      let activate_license_id = activate_license_item.id().clone();
      let show_window_id = show_window_item.id().clone();
      let session_history_id = session_history_item.id().clone();
      let usage_id = usage_item.id().clone();
      let quit_id = quit_item.id().clone();
      let lang_ko_id = lang_ko_item.id().clone();
      let lang_en_id = lang_en_item.id().clone();

      let menu = Menu::with_items(
        app,
        &[
          // Primary Actions
          &show_window_item,
          &session_history_item,
          &usage_item,
          &separator1,
          // Settings
          &autostart_item,
          &activate_license_item,
          &language_submenu,
          &separator2,
          // App Info
          &update_status_item,
          &version_item,
          &check_update_item,
          &separator3,
          // Exit
          &quit_item
        ],
      )?;

      // Register tray menu state for i18n updates
      app.manage(TrayMenuState {
        ko: lang_ko_item.clone(),
        en: lang_en_item.clone(),
        show_window: show_window_item.clone(),
        session_history: session_history_item.clone(),
        usage: usage_item.clone(),
        autostart: autostart_item.clone(),
        activate_license: activate_license_item.clone(),
        language_submenu: language_submenu.clone(),
        check_update: check_update_item.clone(),
        update_status: update_status_item.clone(),
        version_item: version_item.clone(),
        quit: quit_item.clone(),
        current_lang: Mutex::new("en".to_string()),
        update_state: Mutex::new(UpdateState::Latest(version.to_string())),
        version_str: version.to_string(),
      });

      // Load and decode the tray icon PNG
      let tray_icon_bytes = include_bytes!("../icons/tray-icon-template.png");
      let tray_img = image::load_from_memory(tray_icon_bytes)
        .map_err(|e| tauri::Error::AssetNotFound(format!("Failed to load tray icon: {}", e)))?;
      let tray_rgba = tray_img.to_rgba8();
      let (width, height) = tray_rgba.dimensions();
      let tray_icon_image = tauri::image::Image::new(tray_rgba.as_raw(), width, height);

      let _tray = TrayIconBuilder::with_id("tray")
        .icon(tray_icon_image)
        .icon_as_template(true)  // macOS template icon for theme adaptation
        .menu(&menu)
        .on_menu_event(move |app, event| {
          if event.id == check_update_id {
            println!("Checking for updates...");
            let app_handle = app.clone();
            tauri::async_runtime::spawn(async move {
              let lang = app_handle
                .try_state::<TrayMenuState<Wry>>()
                .and_then(|state| state.current_lang.lock().ok().map(|l| l.clone()))
                .unwrap_or_else(|| "en".to_string());
              let locale = get_update_locale(&lang);
              if let Some(state) = app_handle.try_state::<TrayMenuState<Wry>>() {
                apply_update_state(&state, &locale, UpdateState::Checking);
              }

              match app_handle.updater() {
                Ok(updater) => {
                  match updater.check().await {
                    Ok(update_response) => {
                      if let Some(update) = update_response {
                        println!("Update available: version {}", update.version);
                        println!("Download URL: {}", update.download_url);
                        if let Some(state) = app_handle.try_state::<TrayMenuState<Wry>>() {
                          apply_update_state(&state, &locale, UpdateState::Available(update.version.clone()));
                        }
                        
                        // Show dialog to user about available update
                        use tauri_plugin_dialog::{DialogExt, MessageDialogKind, MessageDialogButtons};
                        let confirmed = app_handle.dialog()
                          .message(locale.message_available.replace("{version}", &update.version))
                          .title(locale.title_available)
                          .buttons(MessageDialogButtons::OkCancelCustom(
                            locale.button_install.to_string(),
                            locale.button_later.to_string()
                          ))
                          .blocking_show();
                        
                        if confirmed {
                          // User clicked Install
                          match update.download_and_install(|chunk_length, content_length| {
                            if let Some(total) = content_length {
                              let progress = (chunk_length as f64 / total as f64) * 100.0;
                              println!("Download progress: {:.1}%", progress);
                            }
                          }, || {
                            println!("Download complete, preparing to install...");
                          }).await {
                            Ok(_) => {
                              println!("Update installed successfully. Restarting app to apply.");
                              app_handle.dialog()
                                .message(locale.message_ready)
                                .title(locale.title_ready)
                                .kind(MessageDialogKind::Info)
                                .blocking_show();
                              app_handle.request_restart();
                            }
                            Err(e) => {
                              println!("Failed to download/install update: {:?}", e);
                              app_handle.dialog()
                                .message(locale.message_error_download)
                                .title(locale.title_error_download)
                                .kind(MessageDialogKind::Error)
                                .blocking_show();
                            }
                          }
                        }
                      } else {
                        println!("No updates available");
                        if let Some(state) = app_handle.try_state::<TrayMenuState<Wry>>() {
                          apply_update_state(&state, &locale, UpdateState::Latest(env!("CARGO_PKG_VERSION").to_string()));
                        }
                        // Notify user that app is up to date
                        use tauri_plugin_dialog::{DialogExt, MessageDialogKind};
                        app_handle.dialog()
                          .message(locale.message_no_update.replace("{version}", env!("CARGO_PKG_VERSION")))
                          .title(locale.title_no_update)
                          .kind(MessageDialogKind::Info)
                          .blocking_show();
                      }
                    }
                    Err(e) => {
                      println!("Failed to check for updates: {:?}", e);
                      if let Some(state) = app_handle.try_state::<TrayMenuState<Wry>>() {
                        apply_update_state(&state, &locale, UpdateState::Failed);
                      }
                      use tauri_plugin_dialog::{DialogExt, MessageDialogKind};
                      app_handle.dialog()
                        .message(locale.message_error_check)
                        .title(locale.title_error_check)
                        .kind(MessageDialogKind::Error)
                        .blocking_show();
                    }
                  }
                }
                Err(e) => {
                  println!("Failed to initialize updater: {:?}", e);
                  if let Some(state) = app_handle.try_state::<TrayMenuState<Wry>>() {
                    apply_update_state(&state, &locale, UpdateState::Failed);
                  }
                  use tauri_plugin_dialog::{DialogExt, MessageDialogKind};
                  app_handle.dialog()
                    .message(locale.message_init_error)
                    .title(locale.title_init_error)
                    .kind(MessageDialogKind::Error)
                    .blocking_show();
                }
              }
            });
          } else if event.id == autostart_id {
            let autostart_manager = app.autolaunch();
            let is_enabled = autostart_manager.is_enabled().unwrap_or(false);
            
            if let Some(item) = app.menu().and_then(|menu| menu.get(&autostart_id)) {
              if let Some(check_item) = item.as_check_menuitem() {
                if is_enabled {
                  println!("Disabling autostart...");
                  match autostart_manager.disable() {
                    Ok(_) => {
                      println!("Autostart disabled successfully");
                      let _ = check_item.set_checked(false);
                    }
                    Err(e) => println!("Failed to disable autostart: {:?}", e),
                  }
                } else {
                  println!("Enabling autostart...");
                  match autostart_manager.enable() {
                    Ok(_) => {
                      println!("Autostart enabled successfully");
                      let _ = check_item.set_checked(true);
                    }
                    Err(e) => println!("Failed to enable autostart: {:?}", e),
                  }
                }
              }
            }
          } else if event.id == quit_id {
            app.exit(0);
          } else if event.id == show_window_id {
            if let Some(window) = app.get_webview_window("main") {
              if window.is_visible().unwrap_or(false) {
                let _ = window.hide();
              } else {
                let _ = window.show();
                let _ = window.set_focus();
              }
            }
          } else if event.id == session_history_id {
            // Show window and emit event to open session history modal
            if let Some(window) = app.get_webview_window("main") {
              let _ = window.show();
              let _ = window.set_focus();
              let _ = window.emit("open-session-history", ());
            }
          } else if event.id == activate_license_id {
            // Show window and emit event to open license input modal
            if let Some(window) = app.get_webview_window("main") {
              let _ = window.show();
              let _ = window.set_focus();
              let _ = window.emit("open-license-input", ());
            }
          } else if event.id == usage_id {
            // Show window and emit event to open usage modal
            if let Some(window) = app.get_webview_window("main") {
              let _ = window.show();
              let _ = window.set_focus();
              let _ = window.emit("open-usage", ());
            }
          } else if event.id == lang_ko_id {
            let _ = app.emit("change-language", "ko");
            // Update menu state
            if let Some(menu) = app.menu() {
              if let Some(item) = menu.get(&lang_ko_id) {
                if let Some(check_item) = item.as_check_menuitem() {
                  let _ = check_item.set_checked(true);
                }
              }
              if let Some(item) = menu.get(&lang_en_id) {
                if let Some(check_item) = item.as_check_menuitem() {
                  let _ = check_item.set_checked(false);
                }
              }
            }
          } else if event.id == lang_en_id {
            let _ = app.emit("change-language", "en");
            // Update menu state
            if let Some(menu) = app.menu() {
              if let Some(item) = menu.get(&lang_ko_id) {
                if let Some(check_item) = item.as_check_menuitem() {
                  let _ = check_item.set_checked(false);
                }
              }
              if let Some(item) = menu.get(&lang_en_id) {
                if let Some(check_item) = item.as_check_menuitem() {
                  let _ = check_item.set_checked(true);
                }
              }
            }
          }
        })
        .build(app)?;

      // Initial background update check to surface status in tray without user interaction
      let app_handle_for_status = app.app_handle();
      let app_handle_for_status = app_handle_for_status.clone();
      tauri::async_runtime::spawn(async move {
        let lang = app_handle_for_status
          .try_state::<TrayMenuState<Wry>>()
          .and_then(|state| state.current_lang.lock().ok().map(|l| l.clone()))
          .unwrap_or_else(|| "en".to_string());
        let locale = get_update_locale(&lang);

        if let Some(state) = app_handle_for_status.try_state::<TrayMenuState<Wry>>() {
          apply_update_state(&state, &locale, UpdateState::Checking);
        }

        match app_handle_for_status.updater() {
          Ok(updater) => match updater.check().await {
            Ok(update_response) => {
              if let Some(update) = update_response {
                if let Some(state) = app_handle_for_status.try_state::<TrayMenuState<Wry>>() {
                  apply_update_state(&state, &locale, UpdateState::Available(update.version.clone()));
                }
              } else if let Some(state) = app_handle_for_status.try_state::<TrayMenuState<Wry>>() {
                apply_update_state(&state, &locale, UpdateState::Latest(env!("CARGO_PKG_VERSION").to_string()));
              }
            }
            Err(_) => {
              if let Some(state) = app_handle_for_status.try_state::<TrayMenuState<Wry>>() {
                apply_update_state(&state, &locale, UpdateState::Failed);
              }
            }
          },
          Err(_) => {
            if let Some(state) = app_handle_for_status.try_state::<TrayMenuState<Wry>>() {
              apply_update_state(&state, &locale, UpdateState::Failed);
            }
          }
        }
      });

      app.handle().plugin(
        tauri_plugin_log::Builder::default()
          .level(log::LevelFilter::Info)
          .build(),
      )?;
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
