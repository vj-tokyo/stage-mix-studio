import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useMixerStore, VideoLayer, BlendMode } from "@/store/mixerStore";

interface VideoPlaneProps {
  layer: VideoLayer;
  channelMix: number;
  channelId: 'A' | 'B';
  position: [number, number, number];
}

// Utility function to create proper blend mode material
const createBlendMaterial = (
  texture: THREE.VideoTexture,
  blendMode: BlendMode,
  opacity: number
): THREE.MeshBasicMaterial => {
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: opacity,
  });

  // Apply correct Three.js blending modes
  switch (blendMode) {
    case "normal":
      material.blending = THREE.NormalBlending;
      break;

    case "multiply":
      material.blending = THREE.MultiplyBlending;
      break;

    case "screen":
      // Screen blending using custom blend equation
      material.blending = THREE.CustomBlending;
      material.blendEquation = THREE.AddEquation;
      material.blendSrc = THREE.OneMinusDstColorFactor;
      material.blendDst = THREE.OneFactor;
      break;

    case "overlay":
      // Overlay is complex, approximated with MultiplyBlending for now
      // For true overlay, you'd need a custom shader
      material.blending = THREE.MultiplyBlending;
      material.opacity = Math.min(1, opacity * 1.2); // Slightly enhance
      break;

    case "lighten":
      // Lighten mode using max blend equation
      material.blending = THREE.CustomBlending;
      material.blendEquation = THREE.MaxEquation;
      material.blendSrc = THREE.SrcAlphaFactor;
      material.blendDst = THREE.OneMinusSrcAlphaFactor;
      break;

    case "darken":
      // Darken mode using min blend equation
      material.blending = THREE.CustomBlending;
      material.blendEquation = THREE.MinEquation;
      material.blendSrc = THREE.SrcAlphaFactor;
      material.blendDst = THREE.OneMinusSrcAlphaFactor;
      break;

    case "difference":
      // Difference blending
      material.blending = THREE.CustomBlending;
      material.blendEquation = THREE.ReverseSubtractEquation;
      material.blendSrc = THREE.SrcAlphaFactor;
      material.blendDst = THREE.OneMinusSrcAlphaFactor;
      break;

    default:
      material.blending = THREE.NormalBlending;
      break;
  }

  return material;
};

const VideoPlane: React.FC<VideoPlaneProps> = ({
  layer,
  channelMix,
  channelId,
  position,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const textureRef = useRef<THREE.VideoTexture | null>(null);

  // Create video element and texture
  useEffect(() => {
    if (!layer.videoSrc) return;

    const video = document.createElement("video");
    video.src = layer.videoSrc;
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = true;
    video.playsInline = true;

    // Set video duration in store when loaded
    const handleLoadedMetadata = () => {
      if (video.duration && video.duration !== layer.duration) {
        useMixerStore.getState().updateLayerDuration(channelId, layer.id, video.duration);
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    // Force video to load
    video.load();

    if (layer.isPlaying) {
      video.play().catch(console.error);
    }

    const texture = new THREE.VideoTexture(video);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBAFormat;

    videoRef.current = video;
    textureRef.current = texture;

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.pause();
      video.src = '';
      texture.dispose();
    };
  }, [layer.videoSrc]);

  // Update playback state and sync current time
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    
    // Set video time to match layer
    if (Math.abs(video.currentTime - layer.currentTime) > 0.1) {
      video.currentTime = layer.currentTime;
    }
    
    // Set playback speed
    video.playbackRate = layer.playbackSpeed;
    
    // Handle volume
    video.volume = layer.volume;
    
    // Handle looping
    if (layer.isLooping) {
      video.loop = false; // Handle manually for custom loop points
    } else {
      video.loop = layer.isLooping;
    }

    if (layer.isPlaying) {
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  }, [layer.isPlaying, layer.currentTime, layer.playbackSpeed, layer.volume, layer.isLooping]);

  // Handle custom loop points
  useEffect(() => {
    if (!videoRef.current || !layer.isLooping) return;
    
    const video = videoRef.current;
    const handleTimeUpdate = () => {
      if (video.currentTime >= layer.loopOutPoint) {
        video.currentTime = layer.loopInPoint;
      }
    };
    
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [layer.isLooping, layer.loopInPoint, layer.loopOutPoint]);

  // Sync video time back to store (for timeline display)
  useFrame(() => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const { updateLayerTime } = useMixerStore.getState();
    
    if (layer.isPlaying) {
      // Update store with current video time for timeline sync
      const timeDiff = Math.abs(video.currentTime - layer.currentTime);
      if (timeDiff > 0.2) {
        updateLayerTime(channelId, layer.id, video.currentTime);
      }
    }
  });

  // Create material with proper blend mode
  const material = useMemo(() => {
    if (!textureRef.current) {
      return new THREE.MeshBasicMaterial({
        color: 0x333333,
        transparent: true,
        opacity: Math.max(0.1, layer.opacity * channelMix),
      });
    }

    // Calculate final opacity correctly - ensure visibility
    let finalOpacity = Math.max(0.1, layer.opacity * channelMix);

    // Create material with proper blend mode
    return createBlendMaterial(
      textureRef.current,
      layer.blendMode,
      finalOpacity
    );
  }, [
    layer.opacity,
    layer.blendMode,
    channelMix,
    textureRef.current, // Include texture in dependencies
  ]);

  // Update material when it changes
  useEffect(() => {
    if (meshRef.current && material) {
      meshRef.current.material = material;
    }
  }, [material]);

  if (!layer.videoSrc) {
    return (
      <mesh ref={meshRef} position={position}>
        <planeGeometry args={[4, 2.25]} />
        <meshBasicMaterial color={0x111111} transparent opacity={0.3} />
      </mesh>
    );
  }

  return (
    <mesh ref={meshRef} position={position} material={material}>
      <planeGeometry args={[4, 2.25]} />
    </mesh>
  );
};

const Scene: React.FC = () => {
  const { channels, masterFader } = useMixerStore();

  // Simple crossfade logic: 0 = all A, 1 = all B
  const channelAMix = 1 - masterFader; // A fades out as fader moves to B
  const channelBMix = masterFader;     // B fades in as fader moves to B

  // Check if we have any video content
  const hasVideoContent = channels.A.layers.some(layer => layer.videoSrc && layer.opacity > 0) || 
                          channels.B.layers.some(layer => layer.videoSrc && layer.opacity > 0);

  return (
    <>
      {/* Dark background plane */}
      <mesh position={[0, 0, -0.1]}>
        <planeGeometry args={[8, 4.5]} />
        <meshBasicMaterial color={0x111111} />
      </mesh>

      <ambientLight intensity={1} />

      {/* Always show reference grid */}
      <>
        {/* Center crosshair */}
        <mesh position={[0, 0, 0.001]}>
          <planeGeometry args={[0.1, 2]} />
          <meshBasicMaterial color={0x666666} transparent opacity={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.001]}>
          <planeGeometry args={[2, 0.1]} />
          <meshBasicMaterial color={0x666666} transparent opacity={0.3} />
        </mesh>
        
        {/* Corner markers */}
        {[
          [-1.8, 1, 0.001], [1.8, 1, 0.001], 
          [-1.8, -1, 0.001], [1.8, -1, 0.001]
        ].map((position, index) => (
          <mesh key={index} position={position as [number, number, number]}>
            <planeGeometry args={[0.2, 0.2]} />
            <meshBasicMaterial color={0x888888} transparent opacity={0.4} />
          </mesh>
        ))}
      </>

      {/* Channel A Layers - render with proper z-index */}
      {channels.A.layers.map((layer, index) => (
        <VideoPlane
          key={`A-${layer.id}`}
          layer={layer}
          channelMix={channelAMix}
          channelId="A"
          position={[0, 0, 0.01 + index * 0.001]}
        />
      ))}

      {/* Channel B Layers - render with higher z-index */}
      {channels.B.layers.map((layer, index) => (
        <VideoPlane
          key={`B-${layer.id}`}
          layer={layer}
          channelMix={channelBMix}
          channelId="B"
          position={[0, 0, 0.02 + index * 0.001]}
        />
      ))}

      {/* Status indicator */}
      {hasVideoContent && (
        <mesh position={[3.5, 1.8, 0.001]}>
          <planeGeometry args={[0.3, 0.3]} />
          <meshBasicMaterial color={0x00ff00} transparent opacity={0.8} />
        </mesh>
      )}
    </>
  );
};

export const VideoCanvas: React.FC = () => {
  return (
    <div className="w-full h-full bg-slate-900 rounded-lg overflow-hidden border border-border relative">
      <Canvas
        camera={{
          position: [0, 0, 5],
          fov: 50,
        }}
        gl={{
          preserveDrawingBuffer: true,
          antialias: true,
          alpha: false,
        }}
      >
        <Scene />
      </Canvas>
      
      {/* Fallback overlay for better visibility */}
      <div className="absolute top-4 left-4 text-xs text-muted-foreground bg-black/50 px-2 py-1 rounded">
        Main Output Canvas
      </div>
    </div>
  );
};
