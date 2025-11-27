fn main() {
  // Pass environment variables to rustc at compile time
  // This ensures option_env! can read them during compilation
  if let Ok(key) = std::env::var("NEXT_PUBLIC_POSTHOG_KEY") {
    println!("cargo:rustc-env=NEXT_PUBLIC_POSTHOG_KEY={}", key);
  }
  if let Ok(host) = std::env::var("NEXT_PUBLIC_POSTHOG_HOST") {
    println!("cargo:rustc-env=NEXT_PUBLIC_POSTHOG_HOST={}", host);
  }

  // Re-run build script if these env vars change
  println!("cargo:rerun-if-env-changed=NEXT_PUBLIC_POSTHOG_KEY");
  println!("cargo:rerun-if-env-changed=NEXT_PUBLIC_POSTHOG_HOST");

  tauri_build::build()
}
