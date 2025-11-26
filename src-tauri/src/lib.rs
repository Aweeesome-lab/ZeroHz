use tauri::{
  menu::{Menu, MenuItemBuilder, PredefinedMenuItem, CheckMenuItemBuilder},
  tray::TrayIconBuilder,
  Manager, PhysicalPosition,
};
use tauri_plugin_autostart::ManagerExt;
use tauri_plugin_updater::UpdaterExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_autostart::init(
      tauri_plugin_autostart::MacosLauncher::LaunchAgent,
      None, // No additional arguments
    ))
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_posthog::init(
      tauri_plugin_posthog::PostHogConfig {
          api_key: option_env!("NEXT_PUBLIC_POSTHOG_KEY").unwrap_or("").to_string(),
          api_host: option_env!("NEXT_PUBLIC_POSTHOG_HOST").unwrap_or("https://app.posthog.com").to_string(),
          options: None,
      }
    ))
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

      // Build menu items
      let version_item = MenuItemBuilder::new(&version_text)
        .enabled(false)
        .build(app)?;
      
      let separator1 = PredefinedMenuItem::separator(app)?;
      
      let check_update_item = MenuItemBuilder::new("Check for Updates")
        .build(app)?;
      
      let separator2 = PredefinedMenuItem::separator(app)?;
      
      let autostart_item = CheckMenuItemBuilder::new("Start at Login")
        .checked(is_enabled)
        .build(app)?;
      
      let show_window_item = CheckMenuItemBuilder::new("Show Window")
        .checked(true)
        .build(app)?;

      let separator3 = PredefinedMenuItem::separator(app)?;
      
      let quit_item = MenuItemBuilder::new("Quit")
        .build(app)?;

      // Store menu item IDs for use in the closure
      let check_update_id = check_update_item.id().clone();
      let autostart_id = autostart_item.id().clone();
      let show_window_id = show_window_item.id().clone();
      let quit_id = quit_item.id().clone();

      let menu = Menu::with_items(
        app,
        &[&version_item, &separator1, &check_update_item, &separator2, &autostart_item, &show_window_item, &separator3, &quit_item],
      )?;

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
              match app_handle.updater() {
                Ok(updater) => {
                  match updater.check().await {
                    Ok(update_response) => {
                      if let Some(update) = update_response {
                        println!("Update available: version {}", update.version);
                        println!("Download URL: {}", update.download_url);
                        
                        // Show dialog to user about available update
                        use tauri_plugin_dialog::{DialogExt, MessageDialogKind, MessageDialogButtons};
                        let confirmed = app_handle.dialog()
                          .message(format!("New version {} is available. Would you like to download and install it?", update.version))
                          .title("Update Available")
                          .buttons(MessageDialogButtons::OkCancelCustom("Install".to_string(), "Later".to_string()))
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
                              println!("Update installed successfully. Restart the app to apply.");
                              // Notify user that update is ready
                              app_handle.dialog()
                                .message("Update installed successfully! Please restart ZeroHz to apply the update.")
                                .title("Update Ready")
                                .kind(MessageDialogKind::Info)
                                .blocking_show();
                            }
                            Err(e) => {
                              println!("Failed to download/install update: {:?}", e);
                              app_handle.dialog()
                                .message("Failed to download or install the update. Please try again later.")
                                .title("Update Error")
                                .kind(MessageDialogKind::Error)
                                .blocking_show();
                            }
                          }
                        }
                      } else {
                        println!("No updates available");
                        // Notify user that app is up to date
                        use tauri_plugin_dialog::{DialogExt, MessageDialogKind};
                        app_handle.dialog()
                          .message(format!("You are already running the latest version (v{}).", env!("CARGO_PKG_VERSION")))
                          .title("No Updates Available")
                          .kind(MessageDialogKind::Info)
                          .blocking_show();
                      }
                    }
                    Err(e) => {
                      println!("Failed to check for updates: {:?}", e);
                      use tauri_plugin_dialog::{DialogExt, MessageDialogKind};
                      app_handle.dialog()
                        .message("Failed to check for updates. Please check your internet connection and try again.")
                        .title("Update Check Failed")
                        .kind(MessageDialogKind::Error)
                        .blocking_show();
                    }
                  }
                }
                Err(e) => {
                  println!("Failed to initialize updater: {:?}", e);
                  use tauri_plugin_dialog::{DialogExt, MessageDialogKind};
                  app_handle.dialog()
                    .message("Failed to initialize the updater. Please try again later.")
                    .title("Updater Error")
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
          }
        })
        .build(app)?;

      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
