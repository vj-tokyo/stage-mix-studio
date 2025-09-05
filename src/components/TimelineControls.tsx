import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Plus, X, FastForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useMixerStore, VideoLayer, TimelineMarker } from '@/store/mixerStore';

interface TimelineControlsProps {
  channelId: 'A' | 'B';
  layer: VideoLayer;
  channelColor: 'cyan' | 'magenta';
}

const speedOptions = [
  { value: 0.25, label: '0.25x' },
  { value: 0.5, label: '0.5x' },
  { value: 1, label: '1x' },
  { value: 1.5, label: '1.5x' },
  { value: 2, label: '2x' },
  { value: 4, label: '4x' },
];

export const TimelineControls: React.FC<TimelineControlsProps> = ({
  channelId,
  layer,
  channelColor
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showMarkerInput, setShowMarkerInput] = useState(false);
  const [markerLabel, setMarkerLabel] = useState('');
  const [clickTime, setClickTime] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState<string>('');

  const {
    updateLayerTime,
    updateLayerSpeed,
    toggleLayerLoop,
    setLayerLoop,
    addLayerMarker,
    removeLayerMarker,
    toggleLayerPlayback
  } = useMixerStore();

  // Generate thumbnail at specific time
  const generateThumbnail = useCallback((time: number) => {
    if (!videoRef.current || !canvasRef.current || !layer.videoSrc) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    video.currentTime = time;
    video.onseeked = () => {
      canvas.width = 160;
      canvas.height = 90;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      setThumbnailDataUrl(canvas.toDataURL());
      video.onseeked = null;
    };
  }, [layer.videoSrc]);

  // Handle timeline hover for preview
  const handleTimelineHover = (e: React.MouseEvent) => {
    if (!timelineRef.current || layer.duration === 0 || !layer.videoSrc) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const time = percentage * layer.duration;
    
    setPreviewTime(time);
    setPreviewPosition({ x: e.clientX, y: e.clientY });
    setShowPreview(true);
    generateThumbnail(time);
  };

  const handleTimelineLeave = () => {
    setShowPreview(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current || layer.duration === 0) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * layer.duration;
    
    updateLayerTime(channelId, layer.id, Math.max(0, Math.min(newTime, layer.duration)));
  };

  const handleAddMarker = (time: number) => {
    setClickTime(time);
    setShowMarkerInput(true);
  };

  const confirmAddMarker = () => {
    if (markerLabel.trim()) {
      const marker: TimelineMarker = {
        id: Date.now().toString(),
        time: clickTime,
        label: markerLabel.trim(),
        color: channelColor === 'cyan' ? '#00ffff' : '#ff00ff'
      };
      addLayerMarker(channelId, layer.id, marker);
      setMarkerLabel('');
    }
    setShowMarkerInput(false);
  };

  const handleSpeedChange = (value: string) => {
    updateLayerSpeed(channelId, layer.id, parseFloat(value));
  };

  const handleLoopPointsChange = (values: number[]) => {
    setLayerLoop(channelId, layer.id, values[0], values[1]);
  };

  const progressPercentage = layer.duration > 0 ? (layer.currentTime / layer.duration) * 100 : 0;

  return (
    <motion.div 
      className="timeline-controls space-y-3 p-3 bg-card/50 rounded-lg border border-border/50"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Timeline Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleLayerPlayback(channelId, layer.id)}
            disabled={!layer.videoSrc}
            className={`${layer.isPlaying ? 'bg-green-500/20 border-green-500' : ''}`}
          >
            {layer.isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </Button>
          
          <div className="text-xs font-mono">
            {formatTime(layer.currentTime)} / {formatTime(layer.duration)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={layer.playbackSpeed.toString()} onValueChange={handleSpeedChange}>
            <SelectTrigger className="w-16 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {speedOptions.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleLayerLoop(channelId, layer.id)}
            className={`${layer.isLooping ? (channelColor === 'cyan' ? 'bg-cyan/20 border-cyan' : 'bg-magenta/20 border-magenta') : ''}`}
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        <div 
          ref={timelineRef}
          className="relative h-8 bg-muted rounded cursor-pointer"
          onClick={handleTimelineClick}
          onMouseMove={handleTimelineHover}
          onMouseLeave={handleTimelineLeave}
          onDoubleClick={(e) => {
            if (!timelineRef.current || layer.duration === 0) return;
            const rect = timelineRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = x / rect.width;
            const time = percentage * layer.duration;
            handleAddMarker(time);
          }}
        >
          {/* Progress Bar */}
          <div 
            className={`absolute top-0 left-0 h-full transition-all duration-100 rounded ${channelColor === 'cyan' ? 'bg-cyan/30' : 'bg-magenta/30'}`}
            style={{ width: `${progressPercentage}%` }}
          />
          
          {/* Playhead */}
          <div 
            className={`absolute top-0 w-0.5 h-full transition-all duration-100 ${channelColor === 'cyan' ? 'bg-cyan' : 'bg-magenta'}`}
            style={{ left: `${progressPercentage}%` }}
          />
          
          {/* Loop Points */}
          {layer.isLooping && (
            <>
              <div 
                className="absolute top-0 w-0.5 h-full bg-yellow-400"
                style={{ left: `${(layer.loopInPoint / layer.duration) * 100}%` }}
              />
              <div 
                className="absolute top-0 w-0.5 h-full bg-yellow-400"
                style={{ left: `${(layer.loopOutPoint / layer.duration) * 100}%` }}
              />
            </>
          )}
          
          {/* Markers */}
          {layer.markers.map((marker) => (
            <div
              key={marker.id}
              className="absolute top-0 w-0.5 h-full bg-white cursor-pointer group"
              style={{ left: `${(marker.time / layer.duration) * 100}%` }}
              onClick={(e) => {
                e.stopPropagation();
                updateLayerTime(channelId, layer.id, marker.time);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                removeLayerMarker(channelId, layer.id, marker.id);
              }}
            >
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs px-1 py-0.5 rounded whitespace-nowrap">
                {marker.label}
              </div>
            </div>
          ))}
        </div>

        {/* Hidden video and canvas for thumbnail generation */}
        {layer.videoSrc && (
          <>
            <video
              ref={videoRef}
              src={layer.videoSrc}
              muted
              preload="metadata"
              className="hidden"
            />
            <canvas ref={canvasRef} className="hidden" />
          </>
        )}

        {/* Preview Thumbnail */}
        {showPreview && thumbnailDataUrl && (
          <div 
            className="fixed z-50 pointer-events-none"
            style={{ 
              left: previewPosition.x - 80, 
              top: previewPosition.y - 120,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="bg-black/80 rounded-lg p-2 border border-border">
              <img 
                src={thumbnailDataUrl} 
                alt="Video preview"
                className="w-40 h-[90px] rounded object-cover"
              />
              <div className="text-xs text-white text-center mt-1 font-mono">
                {formatTime(previewTime)}
              </div>
            </div>
          </div>
        )}

        {/* Loop Points Slider */}
        {layer.isLooping && layer.duration > 0 && (
          <div className="px-2">
            <div className="text-xs text-muted-foreground mb-1">Loop Points</div>
            <Slider
              value={[layer.loopInPoint, layer.loopOutPoint]}
              onValueChange={handleLoopPointsChange}
              max={layer.duration}
              min={0}
              step={0.1}
              className="w-full"
            />
          </div>
        )}
      </div>

      {/* Marker Input Modal */}
      {showMarkerInput && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-4 rounded-lg border border-border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Add Marker</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMarkerInput(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <Input
              placeholder="Marker label..."
              value={markerLabel}
              onChange={(e) => setMarkerLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmAddMarker()}
              autoFocus
            />
            
            <div className="flex gap-2">
              <Button size="sm" onClick={confirmAddMarker}>
                Add
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowMarkerInput(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};