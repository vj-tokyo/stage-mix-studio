import { useState, useRef, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Upload, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useMixerStore, VideoLayer, BlendMode } from '@/store/mixerStore';

interface LayerControlsProps {
  channelId: 'A' | 'B';
  layer: VideoLayer;
  channelColor: 'channel-a' | 'channel-b';
}

const blendModes: BlendMode[] = ['normal', 'multiply', 'screen', 'overlay', 'lighten', 'darken', 'difference'];

export const LayerControls: React.FC<LayerControlsProps> = ({ 
  channelId, 
  layer, 
  channelColor 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  
  const { 
    updateLayerSource, 
    updateLayerOpacity, 
    updateLayerBlendMode, 
    toggleLayerPlayback 
  } = useMixerStore();

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateLayerSource(channelId, layer.id, url);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      updateLayerSource(channelId, layer.id, urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  const handleOpacityChange = (values: number[]) => {
    updateLayerOpacity(channelId, layer.id, values[0]);
  };

  const handleBlendModeChange = (value: BlendMode) => {
    updateLayerBlendMode(channelId, layer.id, value);
  };

  return (
    <motion.div 
      className="layer-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-sm font-medium text-${channelColor}`}>
          {layer.name}
        </h3>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleLayerPlayback(channelId, layer.id)}
            disabled={!layer.videoSrc}
            className={`${layer.isPlaying ? `bg-${channelColor}/20 border-${channelColor}` : ''}`}
          >
            {layer.isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {/* Video Source Controls */}
      <div className="space-y-3 mb-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1"
          >
            <Upload className="w-3 h-3 mr-2" />
            File
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="flex-1"
          >
            <Link className="w-3 h-3 mr-2" />
            URL
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {showUrlInput && (
          <div className="flex gap-2">
            <Input
              placeholder="Video URL..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="text-xs"
            />
            <Button size="sm" onClick={handleUrlSubmit}>
              Set
            </Button>
          </div>
        )}

        {layer.videoSrc && (
          <div className="video-preview">
            <video 
              src={layer.videoSrc}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
          </div>
        )}
      </div>

      {/* Opacity Control */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <Label className="text-xs">Opacity</Label>
          <span className={`text-xs text-${channelColor}`}>
            {Math.round(layer.opacity * 100)}%
          </span>
        </div>
        <Slider
          value={[layer.opacity]}
          onValueChange={handleOpacityChange}
          max={1}
          min={0}
          step={0.01}
          className="w-full"
        />
      </div>

      {/* Blend Mode */}
      <div className="space-y-2">
        <Label className="text-xs">Blend Mode</Label>
        <Select value={layer.blendMode} onValueChange={handleBlendModeChange}>
          <SelectTrigger className="w-full text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {blendModes.map((mode) => (
              <SelectItem key={mode} value={mode} className="text-xs">
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </motion.div>
  );
};