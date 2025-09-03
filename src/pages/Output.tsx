import { useEffect, useState } from 'react';
import { VideoCanvas } from '@/components/VideoCanvas';

const Output = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Listen for fullscreen toggle messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'TOGGLE_FULLSCREEN') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(console.error);
        } else {
          document.exitFullscreen().catch(console.error);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Keyboard shortcuts
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'f':
        case 'F':
          event.preventDefault();
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(console.error);
          } else {
            document.exitFullscreen().catch(console.error);
          }
          break;
        case 'Escape':
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(console.error);
          }
          break;
      }
    };

    // Track fullscreen changes
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Cleanup
    return () => {
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">
      {/* Main video output */}
      <div className="w-full h-full">
        <VideoCanvas />
      </div>

      {/* Subtle overlay with controls (only visible on hover) */}
      {!isFullscreen && (
        <div className="absolute top-4 left-4 right-4 opacity-0 hover:opacity-100 transition-opacity duration-300">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2 text-white text-xs">
            <div className="flex justify-between items-center">
              <span>VJ Output Window</span>
              <div className="flex gap-4 text-muted-foreground">
                <span>F - Fullscreen</span>
                <span>ESC - Exit Fullscreen</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen indicator */}
      {isFullscreen && (
        <div className="absolute bottom-4 right-4 opacity-0 hover:opacity-100 transition-opacity duration-300">
          <div className="bg-black/70 backdrop-blur-sm rounded px-2 py-1 text-white text-xs">
            Press ESC to exit fullscreen
          </div>
        </div>
      )}
    </div>
  );
};

export default Output;