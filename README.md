# ZeroHz

**ZeroHz** is a minimalist white noise application designed to help you focus, relax, and sleep better. It features a curated collection of high-quality nature sounds that can be mixed to create your perfect soundscape.

## Features

- **🌊 High-Quality Sounds**: Rain, Wind, Waves, Forest, Stream, Fire, Flight, Train, and Night.
- **🔄 Gapless Playback**: Uses M4A (AAC) format for seamless, uninterrupted looping on both macOS and Windows.
- **🎛️ Sound Mixing**: Individual volume controls for each sound to create custom atmospheres.
- **🤏 Compact Mode**: A non-intrusive mini-player mode that stays out of your way while you work.
- **🖥️ Cross-Platform**: Native desktop experience for macOS and Windows.
- **🌙 Dark Theme**: Easy on the eyes, perfect for night-time usage.

## Tech Stack

Built with modern web technologies for a lightweight and performant desktop app:

- **[Tauri v2](https://tauri.app/)**: For a tiny, secure, and fast native executable.
- **[Next.js](https://nextjs.org/)**: React framework for the UI.
- **[Tailwind CSS](https://tailwindcss.com/)**: For rapid and beautiful styling.
- **[Lucide Icons](https://lucide.dev/)**: For consistent and clean iconography.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- Rust (for Tauri backend)

### Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/Aweeesome-lab/ZeroHz.git
    cd ZeroHz
    ```

2.  **Install dependencies**

    ```bash
    npm install
    ```

3.  **Run in development mode**
    ```bash
    npm run tauri dev
    ```

### Build

To build the application for production:

```bash
npm run tauri build
```

## License

© 2025 ZeroHz. All rights reserved.
