use tauri::{
  menu::{Menu, MenuItem},
  tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
  Manager, PhysicalPosition,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
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

      let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
      let menu = Menu::with_items(app, &[&quit_i])?;

      let _tray = TrayIconBuilder::with_id("tray")
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .on_menu_event(|app, event| {
          match event.id.as_ref() {
            "quit" => {
              app.exit(0);
            }
            _ => {}
          }
        })
        .on_tray_icon_event(|tray, event| match event {
          TrayIconEvent::Click {
            button: MouseButton::Left,
            ..
          } => {
            let app = tray.app_handle();
            if let Some(window) = app.get_webview_window("main") {
              let _ = window.show();
              let _ = window.set_focus();
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
