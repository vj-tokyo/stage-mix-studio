import { motion } from 'framer-motion';
import { LayerControls } from './LayerControls';
import { useMixerStore } from '@/store/mixerStore';

interface ChannelControlsProps {
  channelId: 'A' | 'B';
}

export const ChannelControls: React.FC<ChannelControlsProps> = ({ channelId }) => {
  const { channels } = useMixerStore();
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