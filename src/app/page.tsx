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

      {/* Branding/Title */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10 pt-safe pl-safe">
        <h1 className="text-[#2d5f3f] font-mono text-lg md:text-xl font-bold">
          dark.regenaissance
        </h1>
        <p className="text-[#2d5f3f]/60 font-mono text-xs">
          voice of the underground
        </p>
      </div>

      {/* Mobile status indicator */}
      <div className="absolute top-4 right-4 z-10 md:hidden pt-safe pr-safe">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[#2d5f3f] rounded-full animate-pulse"></div>
          <span className="text-[#2d5f3f]/60 font-mono text-xs">online</span>
        </div>
      </div>
    </main>
  );
}