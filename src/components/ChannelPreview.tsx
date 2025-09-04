import { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useMixerStore, Channel } from '@/store/mixerStore';
import * as THREE from 'three';

interface ChannelPreviewProps {
  channelId: 'A' | 'B';
  className?: string;
}

interface VideoPlaneProps {
  layer: any;
  position: [number, number, number];
  opacity: number;
}

const VideoPlane: React.FC<VideoPlaneProps> = ({ layer, position, opacity }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const textureRef = useRef<THREE.VideoTexture | null>(null);

  useEffect(() => {
    if (!layer.videoSrc) return;

    // Create or reuse video element
    if (!videoRef.current) {
      videoRef.current = document.createElement('video');
      videoRef.current.crossOrigin = 'anonymous';
      videoRef.current.loop = layer.isLooping;
      videoRef.current.muted = layer.isMuted;
      videoRef.current.volume = layer.volume;
      videoRef.current.playbackRate = layer.playbackSpeed;
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
  }, [layer.videoSrc]);

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
  }, [layer.isPlaying, layer.currentTime, layer.volume, layer.isMuted, layer.playbackSpeed]);

  useEffect(() => {
    if (meshRef.current && textureRef.current) {
      const material = meshRef.current.material as THREE.MeshBasicMaterial;
      material.map = textureRef.current;
      material.transparent = true;
      material.opacity = opacity * layer.opacity;
      
      // Set blend mode
      switch (layer.blendMode) {
        case 'multiply':
          material.blending = THREE.MultiplyBlending;
          break;
        case 'screen':
          material.blending = THREE.AdditiveBlending;
          break;
        case 'overlay':
          material.blending = THREE.CustomBlending;
          break;
        default:
          material.blending = THREE.NormalBlending;
      }
      
      material.needsUpdate = true;
    }
  }, [layer.opacity, layer.blendMode, opacity]);

  if (!layer.videoSrc) return null;

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[2, 1.125]} />
      <meshBasicMaterial />
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
          opacity={1}
        />
      ))}
    </>
  );
};

export const ChannelPreview: React.FC<ChannelPreviewProps> = ({ 
  channelId, 
  className = "" 
}) => {
  const { channels } = useMixerStore();
  const channel = channels[channelId];

  return (
    <div className={`aspect-video bg-black rounded-lg overflow-hidden border border-border ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 2], fov: 50 }}
        gl={{ 
          alpha: false, 
          antialias: false, 
          powerPreference: "high-performance" 
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