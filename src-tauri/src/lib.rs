use tauri::{
  menu::{Menu, MenuItemBuilder, PredefinedMenuItem, CheckMenuItemBuilder},
  tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
  Manager, PhysicalPosition,
};
use tauri_plugin_autostart::ManagerExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_autostart::init(
      tauri_plugin_autostart::MacosLauncher::LaunchAgent,
      None, // No additional arguments
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
      
      let autostart_item = CheckMenuItemBuilder::new("Start at Login")
        .checked(is_enabled)
        .build(app)?;
      
      let separator2 = PredefinedMenuItem::separator(app)?;
      
      let quit_item = MenuItemBuilder::new("Quit")
        .build(app)?;

      // Store menu item IDs for use in the closure
      let autostart_id = autostart_item.id().clone();
      let quit_id = quit_item.id().clone();

      let menu = Menu::with_items(
        app,
        &[&version_item, &separator1, &autostart_item, &separator2, &quit_item],
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
          if event.id == autostart_id {
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
          }
        })
        .on_tray_icon_event(|tray, event| match event {
          TrayIconEvent::Click {
            button: MouseButton::Left,
            ..
          } => {
            let app = tray.app_handle();
            if let Some(window) = app.get_webview_window("main") {
              if window.is_visible().unwrap_or(false) {
                 let _ = window.hide();
              } else {
                 let _ = window.show();
                 let _ = window.set_focus();
              }
            }
          }
          _ => {}
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
