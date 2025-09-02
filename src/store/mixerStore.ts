import { create } from 'zustand';

export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'lighten' | 'darken' | 'difference';

export interface VideoLayer {
  id: string;
  name: string;
  videoSrc: string;
  opacity: number;
  blendMode: BlendMode;
  isPlaying: boolean;
  volume: number;
}

export interface Channel {
  id: 'A' | 'B';
  name: string;
  layers: VideoLayer[];
}

interface MixerState {
  // Channels
  channels: Record<'A' | 'B', Channel>;
  
  // Master controls
  masterFader: number; // 0-1, 0 = full A, 1 = full B
  masterBlendMode: BlendMode;
  isRecording: boolean;
  
  // Actions
  updateLayerSource: (channelId: 'A' | 'B', layerId: string, videoSrc: string) => void;
  updateLayerOpacity: (channelId: 'A' | 'B', layerId: string, opacity: number) => void;
  updateLayerBlendMode: (channelId: 'A' | 'B', layerId: string, blendMode: BlendMode) => void;
  toggleLayerPlayback: (channelId: 'A' | 'B', layerId: string) => void;
  updateMasterFader: (value: number) => void;
  updateMasterBlendMode: (blendMode: BlendMode) => void;
  toggleRecording: () => void;
}

const createInitialLayer = (index: number): VideoLayer => ({
  id: `layer-${index}`,
  name: `Layer ${index}`,
  videoSrc: '',
  opacity: 1,
  blendMode: 'normal',
  isPlaying: false,
  volume: 0.5,
});

const createInitialChannel = (id: 'A' | 'B'): Channel => ({
  id,
  name: `Channel ${id}`,
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

  toggleRecording: () =>
    set((state) => ({ isRecording: !state.isRecording })),
}));