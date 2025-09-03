import { motion } from 'framer-motion';
import { VideoCanvas } from './VideoCanvas';
import { ChannelControls } from './ChannelControls';
import { MasterFader } from './MasterFader';
import { VideoLibrary } from './VideoLibrary';
import { OutputWindow } from './OutputWindow';
import { PerformanceMonitor } from './PerformanceMonitor';
import { RecordingControls } from './RecordingControls';
import { useMixerStore } from '@/store/mixerStore';

export const VideoMixer: React.FC = () => {
  const { updateLayerSource } = useMixerStore();

  return (
    <div className="min-h-screen bg-background p-4">
      <motion.div 
        className="max-w-7xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <motion.header 
          className="text-center mb-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-primary mb-2">
            VJ VIDEO MIXER
          </h1>
          <p className="text-muted-foreground mb-4">
            Professional dual-channel video mixing interface
          </p>
          
          {/* Header Controls */}
          <div className="flex justify-center gap-4 mb-4">
            <VideoLibrary onSelectVideo={(src) => console.log('Video selected:', src)} />
            <PerformanceMonitor />
          </div>
        </motion.header>

        {/* Main Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* Preview Area - Full width on mobile, spans 2 cols on desktop */}
          <motion.div 
            className="xl:col-span-2 order-1 space-y-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="bg-card rounded-lg p-4 border border-border">
              <h2 className="text-lg font-semibold text-center mb-4 text-primary">
                LIVE PREVIEW
              </h2>
              <div className="aspect-video">
                <VideoCanvas />
              </div>
            </div>
            
            {/* Output and Recording Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <OutputWindow />
              <RecordingControls />
            </div>
          </motion.div>

          {/* Channel A Controls */}
          <motion.div 
            className="order-2 xl:order-2"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <ChannelControls channelId="A" />
          </motion.div>

          {/* Channel B Controls */}
          <motion.div 
            className="order-3 xl:order-3"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <ChannelControls channelId="B" />
          </motion.div>
        </div>

        {/* Master Fader - Full width at bottom */}
        <motion.div 
          className="mt-8"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <MasterFader />
        </motion.div>
      </motion.div>
    </div>
  );
};