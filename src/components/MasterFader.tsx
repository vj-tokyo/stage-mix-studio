import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { useMixerStore } from "@/store/mixerStore";

// Master Fader Component - Crossfade between channels

export const MasterFader: React.FC = () => {
  const { masterFader, updateMasterFader } = useMixerStore();

  const handleFaderChange = (values: number[]) => {
    updateMasterFader(values[0]);
  };

  return (
    <motion.div
      className="flex w-full flex-col items-center space-y-6 p-6 bg-card rounded-lg border border-border"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* Master Fader Label */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-master mb-2 master-glow">
          MASTER FADER
        </h2>
        <p className="text-xs text-muted-foreground">
          Crossfade between Channel A and Channel B
        </p>
      </div>

      {/* Fader Indicators */}
      <div className="flex justify-between w-full max-w-sm text-sm font-medium">
        <motion.span
          className="text-channel-a"
          animate={{
            opacity: masterFader < 0.5 ? 1 : 0.5,
            scale: masterFader < 0.5 ? 1.1 : 1,
          }}
        >
          A
        </motion.span>
        <motion.span
          className="text-master"
          animate={{
            opacity: Math.abs(masterFader - 0.5) < 0.1 ? 1 : 0.5,
            scale: Math.abs(masterFader - 0.5) < 0.1 ? 1.2 : 1,
          }}
        >
          MIX
        </motion.span>
        <motion.span
          className="text-channel-b"
          animate={{
            opacity: masterFader > 0.5 ? 1 : 0.5,
            scale: masterFader > 0.5 ? 1.1 : 1,
          }}
        >
          B
        </motion.span>
      </div>

      {/* Master Fader Slider */}
      <div className="w-full max-w-sm">
        <Slider
          value={[masterFader]}
          onValueChange={handleFaderChange}
          max={1}
          min={0}
          step={0.01}
          className="w-full"
        />

        {/* Fader Value Display */}
        <div className="flex justify-center mt-2">
          <div className="bg-master/20 px-3 py-1 rounded-full border border-master/40">
            <span className="text-master font-mono text-sm">
              {Math.round(masterFader * 100)}%
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
