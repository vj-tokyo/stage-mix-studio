import { motion } from 'framer-motion';
import { Monitor, Maximize2, X, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMixerStore } from '@/store/mixerStore';
import { useEffect, useState } from 'react';

export const OutputWindow: React.FC = () => {
  const { outputWindowOpen, setOutputWindowOpen } = useMixerStore();
  const [outputWindow, setOutputWindow] = useState<Window | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const openOutputWindow = () => {
    const newWindow = window.open(
      '/output',
      'output-window',
      'width=1920,height=1080,menubar=no,toolbar=no,location=no,status=no,scrollbars=no'
    );
    
    if (newWindow) {
      setOutputWindow(newWindow);
      setOutputWindowOpen(true);
      
      // Setup communication
      newWindow.addEventListener('load', () => {
        setIsConnected(true);
      });

      // Monitor window close
      const checkClosed = setInterval(() => {
        if (newWindow.closed) {
          setOutputWindow(null);
          setOutputWindowOpen(false);
          setIsConnected(false);
          clearInterval(checkClosed);
        }
      }, 1000);
    }
  };

  const closeOutputWindow = () => {
    if (outputWindow) {
      outputWindow.close();
      setOutputWindow(null);
      setOutputWindowOpen(false);
      setIsConnected(false);
    }
  };

  const toggleFullscreen = () => {
    if (outputWindow && isConnected) {
      outputWindow.postMessage({ type: 'TOGGLE_FULLSCREEN' }, '*');
    }
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (outputWindow && !outputWindow.closed) {
        outputWindow.close();
      }
    };
  }, [outputWindow]);

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="bg-card rounded-lg p-4 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Output Window
          </h3>
          
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
              isConnected 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Opens a dedicated window for clean video output, perfect for second monitors or projectors.
          </div>

          <div className="flex gap-2">
            {!outputWindowOpen ? (
              <Button 
                onClick={openOutputWindow}
                className="flex-1"
              >
                <Monitor className="w-4 h-4 mr-2" />
                Open Output Window
              </Button>
            ) : (
              <>
                <Button 
                  onClick={closeOutputWindow}
                  variant="destructive"
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Close Window
                </Button>
                
                <Button 
                  onClick={toggleFullscreen}
                  variant="secondary"
                  disabled={!isConnected}
                >
                  <Maximize2 className="w-4 h-4 mr-2" />
                  Fullscreen
                </Button>
              </>
            )}
          </div>

          {outputWindowOpen && (
            <div className="text-xs text-muted-foreground bg-muted/20 rounded p-2">
              <strong>Tips:</strong>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li>Drag the output window to your second monitor</li>
                <li>Use F key in output window to toggle fullscreen</li>
                <li>Press ESC to exit fullscreen mode</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};