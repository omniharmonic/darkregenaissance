import dynamic from 'next/dynamic';
import { TerminalInterface } from '@/components/TerminalInterface';

// Lazy load the 3D scene to avoid SSR issues
const Scene3D = dynamic(() => import('@/components/Scene3D').then(mod => ({ default: mod.Scene3D })), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-[#0a0a12] flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <div className="inline-block w-8 h-8 border-2 border-[#00ff41] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-[#00ff41] font-mono text-sm animate-pulse">
          initializing forest...
        </p>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="h-screen w-screen bg-[#0a0a12] relative overflow-hidden">
      {/* 3D Scene Background */}
      <Scene3D />

      {/* Terminal Interface Overlay */}
      <TerminalInterface />


      {/* Social Links - Top Right */}
      <div className="absolute top-4 right-4 z-10 pt-safe pr-safe">
        <div className="flex items-center gap-3">
          {/* Mobile status indicator (mobile only) */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="w-2 h-2 bg-[#2d5f3f] rounded-full animate-pulse"></div>
            <span className="text-[#2d5f3f]/60 font-mono text-xs">online</span>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-2">
            {/* X (Twitter) Link */}
            <a
              href="https://x.com/DarkRegenAI"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 md:w-10 md:h-10 border border-[#2d5f3f]/40 hover:border-[#4a7c59]/60 rounded-md flex items-center justify-center transition-all duration-300 hover:bg-[#2d5f3f]/10 group"
              aria-label="Follow on X"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#2d5f3f] group-hover:text-[#4a7c59] transition-colors"
              >
                <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
                <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
              </svg>
            </a>

            {/* Telegram Link */}
            <a
              href="https://t.me/+HR8GOZtJkm9hNTIx"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 md:w-10 md:h-10 border border-[#2d5f3f]/40 hover:border-[#4a7c59]/60 rounded-md flex items-center justify-center transition-all duration-300 hover:bg-[#2d5f3f]/10 group"
              aria-label="Join Telegram"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#2d5f3f] group-hover:text-[#4a7c59] transition-colors"
              >
                <path d="m15 10-4 4 6 6 4 -16 -18 7 4 2 2 6 3 -4" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}