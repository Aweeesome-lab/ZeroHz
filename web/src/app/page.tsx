import Link from "next/link";
import {
  Download,
  Monitor,
  Mail,
  Check,
  Sparkles,
  Timer,
  Headphones,
  Shield,
  LayoutTemplate,
} from "lucide-react";
import DemoPlayer from "../components/DemoPlayer";
import DownloadButton from "../components/DownloadButton";
import Image from "next/image";

// LemonSqueezy 결제 링크
const LEMONSQUEEZY_CHECKOUT_URL =
  "https://zerohz-app.lemonsqueezy.com/buy/7f3f5f67-5a6c-4bec-8bb1-919aa1d735f3";

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
              href="#pricing"
              className="hover:text-black transition-colors"
            >
              Pricing
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
      <main id="hero" className="pt-32 pb-20 px-6">
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
                <p className="text-xl text-black/80 font-medium">
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

      {/* Value/Features Section */}
      <section
        id="features"
        className="py-32 border-t border-black/5 bg-gray-50/50"
      >
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">
              Everything you need to focus.
              <br />
              <span className="text-black/40">Nothing you don&apos;t.</span>
            </h2>
            <p className="text-lg text-black/60 max-w-2xl mx-auto">
              ZeroHz combines high-fidelity audio with powerful productivity
              tools, all wrapped in a distraction-free interface.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <FeatureCard
              icon={<Headphones />}
              title="Curated Soundscapes"
              description="Rain, waves, white noise, and more. High-quality ambient sounds mixed to perfection to help you find your flow instantly."
            />
            <FeatureCard
              icon={<Timer />}
              title="Smart Focus Timer"
              description="Stay on track with the built-in timer. Set your focus duration, track your sessions, and build a consistent deep work habit."
            />
            <FeatureCard
              icon={<LayoutTemplate />}
              title="Menu Bar Native"
              description="Designed to be invisible until you need it. Control playback, switch sounds, and manage timers directly from your menu bar."
            />
            <FeatureCard
              icon={<Shield />}
              title="Privacy First & Offline"
              description="ZeroHz works completely offline. No account required, no tracking, and no data collection. Your focus is your business."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 border-t border-black/5">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">
              Simple, transparent pricing.
            </h2>
            <p className="text-lg text-black/60 max-w-xl mx-auto">
              No subscriptions, no hidden fees. Pay once and own it forever.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="h-full flex flex-col p-8 rounded-3xl bg-white border border-black/5 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="mb-8 min-h-[160px]">
                <h3 className="text-xl font-bold mb-2 text-black/80">Free</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold tracking-tight">$0</span>
                  <span className="text-black/40 font-medium">/ forever</span>
                </div>
                <p className="text-black/40 text-sm mt-4 leading-relaxed">
                  Perfect for trying out ZeroHz and experiencing the focus.
                </p>
              </div>

              <Link
                href="#hero"
                className="w-full py-4 bg-gray-50 text-black border border-black/5 rounded-xl font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2 mb-12 group"
              >
                <Download
                  size={18}
                  className="group-hover:-translate-y-0.5 transition-transform"
                />
                Download Free
              </Link>

              <div className="space-y-4">
                <p className="text-xs font-bold text-black/40 uppercase tracking-widest">
                  What&apos;s included
                </p>
                <ul className="space-y-3">
                  <PricingFeature>All 12 ambient sounds</PricingFeature>
                  <PricingFeature>2 hours daily playtime</PricingFeature>
                  <PricingFeature>3 timer sessions per day</PricingFeature>
                  <PricingFeature>Menu bar integration</PricingFeature>
                </ul>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="relative h-full flex flex-col p-8 rounded-3xl bg-[#0A0A0A] text-white shadow-2xl shadow-amber-500/10 border border-white/10 overflow-hidden group">
              {/* Glow Effect */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl group-hover:bg-amber-500/30 transition-colors duration-500" />

              {/* Badge */}
              <div className="absolute top-6 right-6 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-amber-500/20">
                LIFETIME ACCESS
              </div>

              <div className="relative mb-8 min-h-[160px]">
                <h3 className="text-xl font-bold mb-2 text-amber-500">
                  Pro License
                </h3>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-bold tracking-tight">
                    $9.99
                  </span>
                  <div className="flex flex-col items-start">
                    <span className="text-white/40 line-through text-lg decoration-white/20">
                      $12.99
                    </span>
                  </div>
                </div>
                <p className="text-white/60 text-sm mt-4 leading-relaxed">
                  Unlock the full potential of your focus. No recurring monthly
                  costs.
                </p>
              </div>

              <Link
                href={LEMONSQUEEZY_CHECKOUT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="relative w-full py-4 bg-amber-500 text-black rounded-xl font-bold hover:bg-amber-400 transition-all flex items-center justify-center gap-2 mb-12 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:-translate-y-0.5"
              >
                <Sparkles size={18} />
                Get Lifetime Access
              </Link>

              <div className="relative space-y-4">
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest">
                  Everything in Free, plus
                </p>
                <ul className="space-y-3">
                  <PricingFeature highlighted>
                    Unlimited playtime
                  </PricingFeature>
                  <PricingFeature highlighted>
                    Unlimited timer sessions
                  </PricingFeature>
                  <PricingFeature highlighted>
                    Advanced session statistics
                  </PricingFeature>
                  <PricingFeature highlighted>Priority support</PricingFeature>
                  <PricingFeature highlighted>
                    Future updates included
                  </PricingFeature>
                </ul>
              </div>
            </div>
          </div>

          <p className="text-center text-black/40 text-sm mt-12">
            Already have a license?{" "}
            <span className="text-black/60 font-medium">
              Activate via tray menu → Activate License
            </span>
          </p>
        </div>
      </section>

      {/* Release Notes */}
      <section
        id="release-notes"
        className="py-24 border-t border-black/5 bg-gray-50"
      >
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-3xl font-bold mb-12 text-center">
            Release Notes
          </h2>
          <div className="space-y-12">
            <ReleaseItem
              version="v0.2.7"
              date="November 30, 2025"
              changes={[
                "Stability improvements",
                "Fixed auto-start (Start at Login) functionality",
                "Fixed event listener stability issues",
                "Improved updater compatibility",
              ]}
            />
            <ReleaseItem
              version="v0.2.4"
              date="November 30, 2025"
              changes={[
                "Improved timer accuracy using timestamp delta",
                "Updated trial limits",
              ]}
            />
            <ReleaseItem
              version="v0.2.3"
              date="November 28, 2025"
              changes={[
                "Automatic updates are back on the stable channel (secure download & install)",
                "In-app update banner lets you install new versions without leaving the app",
                "Stronger signature checks to prevent broken or unsigned update builds",
              ]}
            />
            <ReleaseItem
              version="v0.2.2"
              date="November 28, 2025"
              changes={[
                "Added multilingual support (English, Korean)",
                "Introduced Activity Heatmap to visualize focus trends",
                "Enhanced usage tracking with daily limits and auto-stop",
                "App usability improvements and bug fixes",
              ]}
            />
            <ReleaseItem
              version="v0.2.1"
              date="November 27, 2025"
              changes={["Bug fixes and stability improvements"]}
            />
            <ReleaseItem
              version="v0.2.0"
              date="November 27, 2025"
              changes={[
                "Added focus timer with stopwatch and countdown modes",
                "Session history tracking with statistics",
                "Tray menu reorganization for better usability",
              ]}
            />
            <ReleaseItem
              version="v0.1.0 - v0.1.30"
              date="November 23 - 26, 2025"
              changes={[
                "Initial release with basic white noise player functionality",
                "Added 12 ambient sounds: Rain, Wind, Waves, Fire, Forest, Stream, Flight, Train, Night, Keyboard, Thunder, Glass Fruit",
                "Stability improvements and bug fixes",
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
            <Link
              href="mailto:support@zerohz.app"
              className="flex items-center gap-2 px-6 py-3 bg-white border border-black/10 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <Mail size={18} />
              support@zerohz.app
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
    <div className="group p-8 rounded-2xl bg-white border border-black/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="w-12 h-12 rounded-xl bg-black/5 group-hover:bg-black group-hover:text-white transition-colors flex items-center justify-center mb-6 text-black">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 group-hover:text-black transition-colors">
        {title}
      </h3>
      <p className="text-black/60 leading-relaxed group-hover:text-black/70 transition-colors">
        {description}
      </p>
    </div>
  );
}

function PricingFeature({
  children,
  highlighted = false,
}: {
  children: React.ReactNode;
  highlighted?: boolean;
}) {
  return (
    <li className="flex items-center gap-2">
      <Check
        size={16}
        className={highlighted ? "text-white" : "text-black/40"}
      />
      <span className={highlighted ? "text-white/90" : "text-black/60"}>
        {children}
      </span>
    </li>
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
