import { motion } from "framer-motion";
import { VideoCanvas } from "./VideoCanvas";
import { ChannelControls } from "./ChannelControls";
import { ChannelPreview } from "./ChannelPreview";
import { MasterFader } from "./MasterFader";
import { VideoLibrary } from "./VideoLibrary";
import { OutputWindow } from "./OutputWindow";
import { PerformanceMonitor } from "./PerformanceMonitor";
import { RecordingControls } from "./RecordingControls";

export const EnhancedVideoMixer: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <motion.header
        className="border-b border-border/50 bg-card/20 backdrop-blur-sm"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              VJ VIDEO MIXER PRO
            </h1>

            <div className="flex items-center gap-4">
              <PerformanceMonitor />
              <RecordingControls />
              <OutputWindow />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content - Flex Layout */}
      <div className="max-w-7xl mx-auto p-4 flex flex-col min-h-[calc(100vh-100px)]">
        {/* Top Grid - 3 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 mb-6">
          {/* Left Column - Channel A */}
          <motion.div
            className="lg:col-span-3 space-y-4"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-cyan-500/30 p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
                <h2 className="text-lg font-bold text-cyan-400">CHANNEL A</h2>
              </div>

              {/* Channel A Preview */}
              <div className="mb-4 relative">
                <ChannelPreview channelId="A" />
              </div>

              {/* Channel A Controls */}
              <ChannelControls channelId="A" />
            </div>
          </motion.div>

          {/* Center Column - Main Preview */}
          <motion.div
            className="lg:col-span-6 space-y-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 p-4 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-primary">MAIN OUTPUT</h2>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-muted-foreground">LIVE</span>
                </div>
              </div>

              {/* Main Preview Canvas */}
              <div className="aspect-video mb-4">
                <VideoCanvas />
              </div>

              {/* Master Controls */}
              <div className="space-y-4">
                {/* Master Fader */}
                <div className="flex justify-center">
                  <MasterFader />
                </div>
              </div>

              {/* Bottom Section - Video Library */}
              <motion.div
                className="mt-6"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <VideoLibrary
                  onSelectVideo={(src) => console.log("Video selected:", src)}
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Right Column - Channel B */}
          <motion.div
            className="lg:col-span-3 space-y-4"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-pink-500/30 p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse"></div>
                <h2 className="text-lg font-bold text-pink-400">CHANNEL B</h2>
              </div>

              {/* Channel B Preview */}
              <div className="mb-4 relative">
                <ChannelPreview channelId="B" />
              </div>

              {/* Channel B Controls */}
              <ChannelControls channelId="B" />
            </div>
          </motion.div>
        </div>

        {/* Bottom Section - Video Library */}
        {/* <motion.div
          className="mt-6"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <VideoLibrary
            onSelectVideo={(src) => console.log("Video selected:", src)}
          />
        </motion.div> */}
      </div>
    </div>
  );
};
