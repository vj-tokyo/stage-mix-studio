import { create } from 'zustand';

export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'lighten' | 'darken' | 'difference';

export interface VideoLibraryItem {
  id: string;
  name: string;
  url: string;
  thumbnail?: string;
  duration?: number;
  resolution?: string;
  isUploading?: boolean;
  error?: string;
}

export interface VideoLayer {
  id: string;
  name: string;
  videoSrc: string;
  opacity: number;
  blendMode: BlendMode;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
}

export interface Channel {
  id: 'A' | 'B';
  name: string;
  layers: VideoLayer[];
  blendMode: BlendMode;
}

interface MixerState {
  // Channels
  channels: Record<'A' | 'B', Channel>;
  
  // Master controls
  masterFader: number; // 0-1, 0 = full A, 1 = full B
  masterBlendMode: BlendMode;
  isRecording: boolean;
  
  // Video Library
  videoLibrary: VideoLibraryItem[];
  
  // Output Window
  outputWindowOpen: boolean;
  
  // Performance
  fps: number;
  
  // Actions
  updateLayerSource: (channelId: 'A' | 'B', layerId: string, videoSrc: string) => void;
  updateLayerOpacity: (channelId: 'A' | 'B', layerId: string, opacity: number) => void;
  updateLayerBlendMode: (channelId: 'A' | 'B', layerId: string, blendMode: BlendMode) => void;
  updateLayerVolume: (channelId: 'A' | 'B', layerId: string, volume: number) => void;
  toggleLayerMute: (channelId: 'A' | 'B', layerId: string) => void;
  toggleLayerPlayback: (channelId: 'A' | 'B', layerId: string) => void;
  updateChannelBlendMode: (channelId: 'A' | 'B', blendMode: BlendMode) => void;
  updateMasterFader: (value: number) => void;
  updateMasterBlendMode: (blendMode: BlendMode) => void;
  toggleRecording: () => void;
  addVideoToLibrary: (item: VideoLibraryItem) => void;
  removeVideoFromLibrary: (id: string) => void;
  setOutputWindowOpen: (open: boolean) => void;
  updateFPS: (fps: number) => void;
}

const createInitialLayer = (index: number): VideoLayer => ({
  id: `layer-${index}`,
  name: `Layer ${index}`,
  videoSrc: '',
  opacity: 1,
  blendMode: 'normal',
  isPlaying: false,
  volume: 0.5,
  isMuted: false,
});

const createInitialChannel = (id: 'A' | 'B'): Channel => ({
  id,
  name: `Channel ${id}`,
  blendMode: 'normal',
  layers: [
    createInitialLayer(1),
    createInitialLayer(2),
    createInitialLayer(3),
  ],
});

export const useMixerStore = create<MixerState>((set) => ({
  channels: {
    A: createInitialChannel('A'),
    B: createInitialChannel('B'),
  },
  
  masterFader: 0.5,
  masterBlendMode: 'normal',
  isRecording: false,
  videoLibrary: [],
  outputWindowOpen: false,
  fps: 60,
  
  updateLayerSource: (channelId, layerId, videoSrc) =>
    set((state) => ({
      channels: {
        ...state.channels,
        [channelId]: {
          ...state.channels[channelId],
          layers: state.channels[channelId].layers.map((layer) =>
            layer.id === layerId ? { ...layer, videoSrc } : layer
          ),
        },
      },
    })),

  updateLayerOpacity: (channelId, layerId, opacity) =>
    set((state) => ({
      channels: {
        ...state.channels,
        [channelId]: {
          ...state.channels[channelId],
          layers: state.channels[channelId].layers.map((layer) =>
            layer.id === layerId ? { ...layer, opacity } : layer
          ),
        },
      },
    })),

  updateLayerBlendMode: (channelId, layerId, blendMode) =>
    set((state) => ({
      channels: {
        ...state.channels,
        [channelId]: {
          ...state.channels[channelId],
          layers: state.channels[channelId].layers.map((layer) =>
            layer.id === layerId ? { ...layer, blendMode } : layer
          ),
        },
      },
    })),

  toggleLayerPlayback: (channelId, layerId) =>
    set((state) => ({
      channels: {
        ...state.channels,
        [channelId]: {
          ...state.channels[channelId],
          layers: state.channels[channelId].layers.map((layer) =>
            layer.id === layerId ? { ...layer, isPlaying: !layer.isPlaying } : layer
          ),
        },
      },
    })),

  updateMasterFader: (value) =>
    set({ masterFader: value }),

  updateMasterBlendMode: (blendMode) =>
    set({ masterBlendMode: blendMode }),

  updateLayerVolume: (channelId, layerId, volume) =>
    set((state) => ({
      channels: {
        ...state.channels,
        [channelId]: {
          ...state.channels[channelId],
          layers: state.channels[channelId].layers.map((layer) =>
            layer.id === layerId ? { ...layer, volume } : layer
          ),
        },
      },
    })),

  toggleLayerMute: (channelId, layerId) =>
    set((state) => ({
      channels: {
        ...state.channels,
        [channelId]: {
          ...state.channels[channelId],
          layers: state.channels[channelId].layers.map((layer) =>
            layer.id === layerId ? { ...layer, isMuted: !layer.isMuted } : layer
          ),
        },
      },
    })),

  updateChannelBlendMode: (channelId, blendMode) =>
    set((state) => ({
      channels: {
        ...state.channels,
        [channelId]: {
          ...state.channels[channelId],
          blendMode,
        },
      },
    })),

  toggleRecording: () =>
    set((state) => ({ isRecording: !state.isRecording })),

  addVideoToLibrary: (item) =>
    set((state) => ({ videoLibrary: [...state.videoLibrary, item] })),

  removeVideoFromLibrary: (id) =>
    set((state) => ({ 
      videoLibrary: state.videoLibrary.filter(item => item.id !== id) 
    })),

  setOutputWindowOpen: (open) =>
    set({ outputWindowOpen: open }),

  updateFPS: (fps) =>
    set({ fps }),
}));