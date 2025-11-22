use tauri::{
  menu::{Menu, MenuItem},
  tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
  Manager,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      let window = app.get_webview_window("main").unwrap();

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
