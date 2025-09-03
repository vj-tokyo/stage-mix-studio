import { motion } from 'framer-motion';
import { LayerControls } from './LayerControls';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useMixerStore, BlendMode } from '@/store/mixerStore';

interface ChannelControlsProps {
  channelId: 'A' | 'B';
}

const blendModes: BlendMode[] = ['normal', 'multiply', 'screen', 'overlay', 'lighten', 'darken', 'difference'];

export const ChannelControls: React.FC<ChannelControlsProps> = ({ channelId }) => {
  const { channels, updateChannelBlendMode } = useMixerStore();
  const channel = channels[channelId];
  
  const channelColor = channelId === 'A' ? 'channel-a' : 'channel-b';
  const glowClass = channelId === 'A' ? 'channel-a-glow' : 'channel-b-glow';

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, x: channelId === 'A' ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Channel Header */}
      <div className={`channel-header bg-${channelColor} text-${channelColor}-foreground ${glowClass}`}>
        Channel {channelId}
      </div>

      {/* Channel Blend Mode */}
      <div className="bg-card rounded-lg p-3 border border-border space-y-2">
        <Label className="text-xs">Channel Blend Mode</Label>
        <Select 
          value={channel.blendMode} 
          onValueChange={(value: BlendMode) => updateChannelBlendMode(channelId, value)}
        >
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

      {/* Layer Controls */}
      <div className="space-y-3">
        {channel.layers.map((layer, index) => (
          <LayerControls
            key={layer.id}
            channelId={channelId}
            layer={layer}
            channelColor={channelColor}
          />
        ))}
      </div>
    </motion.div>
  );
};