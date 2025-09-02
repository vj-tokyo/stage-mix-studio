import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useMixerStore, VideoLayer } from '@/store/mixerStore';

interface VideoPlaneProps {
  layer: VideoLayer;
  channelMix: number;
  position: [number, number, number];
}

const VideoPlane: React.FC<VideoPlaneProps> = ({ layer, channelMix, position }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const textureRef = useRef<THREE.VideoTexture | null>(null);

  // Create video element and texture
  useEffect(() => {
    if (!layer.videoSrc) return;

    const video = document.createElement('video');
    video.src = layer.videoSrc;
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    
    if (layer.isPlaying) {
      video.play().catch(console.error);
    }

    const texture = new THREE.VideoTexture(video);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    videoRef.current = video;
    textureRef.current = texture;

    return () => {
      video.pause();
      texture.dispose();
    };
  }, [layer.videoSrc]);

  // Update playback state
  useEffect(() => {
    if (!videoRef.current) return;

    if (layer.isPlaying) {
      videoRef.current.play().catch(console.error);
    } else {
      videoRef.current.pause();
    }
  }, [layer.isPlaying]);

  // Create material with blend mode
  const material = useMemo(() => {
    if (!textureRef.current) {
      return new THREE.MeshBasicMaterial({ 
        color: 0x333333,
        transparent: true,
        opacity: layer.opacity * channelMix
      });
    }

    const materialProps: any = {
      map: textureRef.current,
      transparent: true,
      opacity: layer.opacity * channelMix,
    };

    // Apply blend mode through opacity and color mixing instead of Three.js blending
    switch (layer.blendMode) {
      case 'multiply':
        materialProps.opacity = (layer.opacity * channelMix) * 0.8;
        break;
      case 'screen':
        materialProps.opacity = (layer.opacity * channelMix) * 1.2;
        break;
      case 'overlay':
        materialProps.opacity = layer.opacity * channelMix;
        break;
      default:
        materialProps.opacity = layer.opacity * channelMix;
    }

    return new THREE.MeshBasicMaterial(materialProps);
  }, [layer.opacity, layer.blendMode, channelMix, textureRef.current]);

  if (!layer.videoSrc) {
    return (
      <mesh ref={meshRef} position={position}>
        <planeGeometry args={[4, 2.25]} />
        <meshBasicMaterial 
          color={0x111111} 
          transparent 
          opacity={0.3} 
        />
      </mesh>
    );
  }

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[4, 2.25]} />
      <primitive object={material} />
    </mesh>
  );
};

const Scene: React.FC = () => {
  const { channels, masterFader } = useMixerStore();
  
  const channelAMix = 1 - masterFader;
  const channelBMix = masterFader;

  return (
    <>
      <ambientLight intensity={0.5} />
      
      {/* Channel A Layers */}
      {channels.A.layers.map((layer, index) => (
        <VideoPlane
          key={`A-${layer.id}`}
          layer={layer}
          channelMix={channelAMix}
          position={[-0.1 * index, 0.1 * index, index * 0.01]}
        />
      ))}
      
      {/* Channel B Layers */}
      {channels.B.layers.map((layer, index) => (
        <VideoPlane
          key={`B-${layer.id}`}
          layer={layer}
          channelMix={channelBMix}
          position={[0.1 * index, -0.1 * index, (index + 3) * 0.01]}
        />
      ))}
    </>
  );
};

export const VideoCanvas: React.FC = () => {
  return (
    <div className="w-full h-full bg-card rounded-lg overflow-hidden border border-border">
      <Canvas 
        camera={{ 
          position: [0, 0, 5], 
          fov: 50 
        }}
        gl={{ 
          preserveDrawingBuffer: true,
          antialias: true 
        }}
      >
        <Scene />
      </Canvas>
    </div>
  );
};