import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle } from 'lucide-react';
import { useMixerStore } from '@/store/mixerStore';

export const PerformanceMonitor: React.FC = () => {
  const { fps, updateFPS } = useMixerStore();
  const [avgFPS, setAvgFPS] = useState(60);
  const [fpsHistory, setFpsHistory] = useState<number[]>([]);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        const currentFPS = Math.round((frameCount * 1000) / (currentTime - lastTime));
        updateFPS(currentFPS);
        
        setFpsHistory(prev => {
          const newHistory = [...prev, currentFPS].slice(-10);
          const avg = Math.round(newHistory.reduce((a, b) => a + b, 0) / newHistory.length);
          setAvgFPS(avg);
          return newHistory;
        });

        frameCount = 0;
        lastTime = currentTime;
      }

      animationId = requestAnimationFrame(measureFPS);
    };

    animationId = requestAnimationFrame(measureFPS);
    return () => cancelAnimationFrame(animationId);
  }, [updateFPS]);

  const getPerformanceStatus = () => {
    if (avgFPS >= 55) return { status: 'excellent', color: 'text-green-400', bg: 'bg-green-500/20' };
    if (avgFPS >= 45) return { status: 'good', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    if (avgFPS >= 30) return { status: 'fair', color: 'text-orange-400', bg: 'bg-orange-500/20' };
    return { status: 'poor', color: 'text-red-400', bg: 'bg-red-500/20' };
  };

  const { status, color, bg } = getPerformanceStatus();

  return (
    <motion.div 
      className="bg-card rounded-lg p-3 border border-border"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Performance</span>
        </div>
        
        <div className="flex items-center gap-2">
          {status === 'poor' && <AlertTriangle className="w-4 h-4 text-red-400" />}
          <div className={`px-2 py-1 rounded text-xs font-mono ${bg} ${color} border border-current/30`}>
            {fps} FPS
          </div>
        </div>
      </div>
      
      <div className="mt-2">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Avg: {avgFPS} FPS</span>
          <span className="capitalize">{status}</span>
        </div>
        
        {/* Simple FPS graph */}
        <div className="flex gap-px h-6 items-end">
          {fpsHistory.map((value, index) => (
            <div
              key={index}
              className={`flex-1 rounded-sm ${
                value >= 55 ? 'bg-green-500/40' :
                value >= 45 ? 'bg-yellow-500/40' :
                value >= 30 ? 'bg-orange-500/40' : 'bg-red-500/40'
              }`}
              style={{ height: `${Math.max((value / 60) * 100, 10)}%` }}
            />
          ))}
        </div>
      </div>

      {status === 'poor' && (
        <div className="mt-2 text-xs text-red-400 bg-red-500/10 rounded p-2">
          Performance is low. Consider reducing video quality or layer count.
        </div>
      )}
    </motion.div>
  );
};