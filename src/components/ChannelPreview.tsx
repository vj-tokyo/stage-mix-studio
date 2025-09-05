import { useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import {
  useMixerStore,
  Channel,
  BlendMode,
  VideoLayer,
} from "@/store/mixerStore";
import * as THREE from "three";

interface ChannelPreviewProps {
  channelId: "A" | "B";
  className?: string;
}

interface VideoPlaneProps {
  layer: VideoLayer;
  position: [number, number, number];
  opacity: number;
}

// Shared blend mode creation function (same as VideoCanvas)
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

  switch (blendMode) {
    case "normal":
      material.blending = THREE.NormalBlending;
      break;

    case "multiply":
      material.blending = THREE.MultiplyBlending;
      break;

    case "screen":
      material.blending = THREE.CustomBlending;
      material.blendEquation = THREE.AddEquation;
      material.blendSrc = THREE.OneMinusDstColorFactor;
      material.blendDst = THREE.OneFactor;
      break;

    case "overlay":
      material.blending = THREE.MultiplyBlending;
      material.opacity = Math.min(1, opacity * 1.2);
      break;

    case "lighten":
      material.blending = THREE.CustomBlending;
      material.blendEquation = THREE.MaxEquation;
      material.blendSrc = THREE.SrcAlphaFactor;
      material.blendDst = THREE.OneMinusSrcAlphaFactor;
      break;

    case "darken":
      material.blending = THREE.CustomBlending;
      material.blendEquation = THREE.MinEquation;
      material.blendSrc = THREE.SrcAlphaFactor;
      material.blendDst = THREE.OneMinusSrcAlphaFactor;
      break;

    case "difference":
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
  position,
  opacity,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const textureRef = useRef<THREE.VideoTexture | null>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial | null>(null);

  useEffect(() => {
    if (!layer.videoSrc) return;

    // Create or reuse video element
    if (!videoRef.current) {
      videoRef.current = document.createElement("video");
      videoRef.current.crossOrigin = "anonymous";
      videoRef.current.loop = layer.isLooping;
      videoRef.current.muted = layer.isMuted;
      videoRef.current.volume = layer.volume;
      videoRef.current.playbackRate = layer.playbackSpeed;
      videoRef.current.playsInline = true;
    }

    const video = videoRef.current;
    video.src = layer.videoSrc;
    video.currentTime = layer.currentTime;

    // Create video texture
    textureRef.current = new THREE.VideoTexture(video);
    textureRef.current.minFilter = THREE.LinearFilter;
    textureRef.current.magFilter = THREE.LinearFilter;
    textureRef.current.format = THREE.RGBAFormat;

    return () => {
      if (textureRef.current) {
        textureRef.current.dispose();
      }
    };
  }, [
    layer.videoSrc,
    layer.currentTime,
    layer.isLooping,
    layer.isMuted,
    layer.playbackSpeed,
    layer.volume,
  ]);

  // Update video properties
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = layer.currentTime;
      videoRef.current.volume = layer.isMuted ? 0 : layer.volume;
      videoRef.current.playbackRate = layer.playbackSpeed;

      if (layer.isPlaying) {
        videoRef.current.play().catch(console.error);
      } else {
        videoRef.current.pause();
      }
    }
  }, [
    layer.isPlaying,
    layer.currentTime,
    layer.volume,
    layer.isMuted,
    layer.playbackSpeed,
  ]);

  // Update material with correct blend mode
  useEffect(() => {
    if (meshRef.current && textureRef.current) {
      // Calculate final opacity
      const finalOpacity = opacity * layer.opacity;

      // Create material with proper blend mode
      const newMaterial = createBlendMaterial(
        textureRef.current,
        layer.blendMode,
        finalOpacity
      );

      // Dispose old material if exists
      if (materialRef.current) {
        materialRef.current.dispose();
      }

      // Apply new material
      meshRef.current.material = newMaterial;
      materialRef.current = newMaterial;
    }
  }, [layer.opacity, layer.blendMode, opacity]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (materialRef.current) {
        materialRef.current.dispose();
      }
    };
  }, []);

  if (!layer.videoSrc) return null;

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[2, 1.125]} />
      {/* Material will be set via ref */}
    </mesh>
  );
};

const ChannelScene: React.FC<{ channel: Channel }> = ({ channel }) => {
  return (
    <>
      {/* Background */}
      <mesh position={[0, 0, -2]}>
        <planeGeometry args={[4, 3]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Ambient Light */}
      <ambientLight intensity={1} />

      {/* Video Layers */}
      {channel.layers.map((layer, index) => (
        <VideoPlane
          key={layer.id}
          layer={layer}
          position={[0, 0, index * 0.01]}
          opacity={1} // Full opacity for preview
        />
      ))}
    </>
  );
};

export const ChannelPreview: React.FC<ChannelPreviewProps> = ({
  channelId,
  className = "",
}) => {
  const { channels } = useMixerStore();
  const channel = channels[channelId];

  return (
    <div
      className={`aspect-video bg-black rounded-lg overflow-hidden border border-border ${className} relative`}
    >
      <Canvas
        camera={{ position: [0, 0, 2], fov: 50 }}
        gl={{
          alpha: false,
          antialias: false,
          powerPreference: "high-performance",
        }}
      >
        <ChannelScene channel={channel} />
      </Canvas>

      {/* Channel Label */}
      <div className="absolute top-2 left-2 text-xs font-bold text-white bg-black/50 px-2 py-1 rounded">
        CH {channelId}
      </div>
    </div>
  );
};
