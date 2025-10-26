'use client';

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-[#0a0a12] flex items-center justify-center z-50">
      <div className="text-center">
        <div className="mb-8">
          <div className="inline-block w-8 h-8 border-2 border-[#00ff41] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-[#00ff41] font-mono text-sm animate-pulse">
          initializing forest...
        </p>
        <p className="text-[#2d5f3f] font-mono text-xs mt-2 opacity-60">
          connecting to the mycelium
        </p>
      </div>
    </div>
  );
}