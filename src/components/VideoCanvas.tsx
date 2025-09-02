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
        opacity: Math.max(0.1, layer.opacity * channelMix)
      });
    }

    // Fix opacity calculation - don't double-apply transparency
    let finalOpacity = layer.opacity;
    
    // Apply channel mix properly - if channelMix is 0, layer should be invisible
    if (channelMix <= 0.01) {
      finalOpacity = 0;
    } else if (channelMix >= 0.99) {
      // Full opacity from this channel
      finalOpacity = layer.opacity;
    } else {
      // Proportional mixing
      finalOpacity = layer.opacity * channelMix;
    }

    const materialProps: any = {
      map: textureRef.current,
      transparent: finalOpacity < 1,
      opacity: finalOpacity,
    };

    // Apply blend mode adjustments more subtly
    switch (layer.blendMode) {
      case 'multiply':
        // Keep original opacity for multiply
        break;
      case 'screen':
        // Screen mode can be slightly brighter
        materialProps.opacity = Math.min(1, finalOpacity * 1.05);
        break;
      case 'overlay':
        // Overlay keeps original opacity
        break;
      case 'difference':
        // Difference mode keeps original opacity
        break;
      default:
        // Normal mode keeps original opacity
        break;
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
  
  // Fix opacity calculation - when fader is 0 show only A, when 1 show only B
  const channelAMix = masterFader === 0 ? 1 : (1 - masterFader);
  const channelBMix = masterFader === 1 ? 1 : masterFader;

  return (
    <>
      {/* Black background plane */}
      <mesh position={[0, 0, -1]}>
        <planeGeometry args={[8, 4.5]} />
        <meshBasicMaterial color={0x000000} />
      </mesh>
      
      <ambientLight intensity={1} />
      
      {/* Channel A Layers */}
      {channels.A.layers.map((layer, index) => (
        <VideoPlane
          key={`A-${layer.id}`}
          layer={layer}
          channelMix={channelAMix}
          position={[0, 0, index * 0.001]}
        />
      ))}
      
      {/* Channel B Layers */}
      {channels.B.layers.map((layer, index) => (
        <VideoPlane
          key={`B-${layer.id}`}
          layer={layer}
          channelMix={channelBMix}
          position={[0, 0, (index + 3) * 0.001]}
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