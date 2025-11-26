import Link from "next/link";
import { Download, Moon, Monitor, Mail, Zap } from "lucide-react";
import DemoPlayer from "../components/DemoPlayer";
import DownloadButton from "../components/DownloadButton";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-black selection:bg-black/10">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-black/5 bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight font-serif">
            <div className="w-8 h-8 relative">
              <Image
                src="/logo.png"
                alt="ZeroHz"
                fill
                className="object-contain"
              />
            </div>
            ZeroHz
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-black/60">
            <Link
              href="#features"
              className="hover:text-black transition-colors"
            >
              Features
            </Link>
            <Link
              href="#support"
              className="hover:text-black transition-colors"
            >
              Support
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-5xl text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-linear-to-b from-black to-black/60 pb-2">
            Minimalist White Noise for Deep Focus.
          </h1>

          <p className="text-lg md:text-xl text-black/60 max-w-2xl mx-auto leading-relaxed">
            ZeroHz is a minimalist white noise player for macOS and Windows.
            Designed to live in your menu bar, it helps you stay in the zone
            without getting in your way.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <DownloadButton
              platform="mac"
              className="group relative px-8 py-4 bg-black text-white rounded-full font-semibold hover:bg-black/80 transition-all flex items-center gap-2 shadow-lg shadow-black/20"
            >
              <Download size={20} />
              Download for Mac
            </DownloadButton>
            <DownloadButton
              platform="win"
              className="px-8 py-4 bg-gray-100 text-black rounded-full font-semibold hover:bg-gray-200 transition-all flex items-center gap-2 border border-black/5"
            >
              <Monitor size={20} />
              Download for Windows
            </DownloadButton>
          </div>

          {/* Interactive Demo */}
          <div className="mt-20 relative">
            <div className="relative z-20">
              <div className="text-center mb-8 animate-fade-in">
                <p className="text-sm font-medium text-black/40 uppercase tracking-widest mb-2">
                  Interactive Demo
                </p>
                <p className="text-xl text-black/80 font-serif italic">
                  Turn up your volume and click to experience
                </p>
              </div>
              <div className="flex justify-center -mt-2">
                <svg
                  width="40"
                  height="80"
                  viewBox="0 0 60 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-black/30"
                  style={{ transform: "rotate(-5deg)" }}
                >
                  <g
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {/* Shaft - Simple curve */}
                    <path d="M30 10 C 30 10, 45 40, 30 90" />

                    {/* Arrowhead */}
                    <path d="M18 78 L 30 90 L 42 75" />
                  </g>
                </svg>
              </div>
              <DemoPlayer className="animate-breathe" />
              <p className="text-xs text-black/30 mt-4">
                * Web demo simulates the UI. Download the app for full system
                integration.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section
        id="features"
        className="py-24 border-t border-black/5 bg-gray-50"
      >
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Zap />}
              title="One-Click Serenity"
              description="Instantly accessible from your menu bar. No accounts, no ads, just pure focus."
            />
            <FeatureCard
              icon={<Moon />}
              title="Seamless Design"
              description="Native look and feel that adapts perfectly to your system's light or dark mode."
            />
            <FeatureCard
              icon={<Monitor />}
              title="Offline Ready"
              description="Built with Tauri for maximum performance. Works completely offline without internet."
            />
          </div>
        </div>
      </section>

      {/* Release Notes */}
      <section id="release-notes" className="py-24 border-t border-black/5">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-3xl font-bold mb-12 text-center">
            Release Notes
          </h2>
          <div className="space-y-12">
            <ReleaseItem
              version="v0.1.26"
              date="November 26, 2025"
              changes={["Fixed analytics initialization issue"]}
            />
            <ReleaseItem
              version="v0.1.25"
              date="November 26, 2025"
              changes={["General improvements and bug fixes"]}
            />
            <ReleaseItem
              version="v0.1.24"
              date="November 26, 2025"
              changes={["Added new sound: Glass Fruit"]}
            />
            <ReleaseItem
              version="v0.1.16"
              date="November 25, 2025"
              changes={["Added 2 new sounds: Keyboard and Thunder"]}
            />
            <ReleaseItem
              version="v0.1.15"
              date="November 24, 2025"
              changes={[
                "Added 5 new sounds: Forest, Stream, Flight, Train, Night",
              ]}
            />
            <ReleaseItem
              version="v0.1.0"
              date="November 23, 2025"
              changes={[
                "Initial release",
                "Basic white noise player functionality",
                "Included 4 ambient sounds: Rain, Wind, Waves, and Fire",
              ]}
            />
          </div>
        </div>
      </section>

      {/* Support */}
      <section
        id="support"
        className="py-24 border-t border-black/5 bg-gray-50"
      >
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Need Help?</h2>
          <p className="text-black/60 mb-8 max-w-xl mx-auto">
            Found a bug or have a feature request? We&apos;re open source and
            happy to help.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="https://www.threads.com/@nerd_makr"
              className="flex items-center gap-2 px-6 py-3 bg-white border border-black/10 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <Mail size={18} />
              Contact via Threads
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-black/5 text-center text-black/40 text-sm bg-white">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center gap-2 mb-4 font-bold text-black/80 font-serif">
            <div className="w-5 h-5 relative">
              <Image
                src="/logo.png"
                alt="ZeroHz"
                fill
                className="object-contain"
              />
            </div>
            ZeroHz
          </div>
          <p>&copy; {new Date().getFullYear()} ZeroHz. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-8 rounded-2xl bg-white border border-black/5 shadow-sm hover:shadow-md transition-all">
      <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center mb-6 text-black">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-black/60 leading-relaxed">{description}</p>
    </div>
  );
}

function ReleaseItem({
  version,
  date,
  changes,
}: {
  version: string;
  date: string;
  changes: string[];
}) {
  return (
    <div className="relative pl-8 border-l border-black/10">
      <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-black border-2 border-white" />
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-xl font-bold">{version}</h3>
        <span className="text-sm text-black/40 font-mono">{date}</span>
      </div>
      <ul className="space-y-2">
        {changes.map((change, i) => (
          <li key={i} className="text-black/70 flex items-start gap-2">
            <span className="mt-2 w-1 h-1 rounded-full bg-black/40 shrink-0" />
            {change}
          </li>
        ))}
      </ul>
    </div>
  );
}
