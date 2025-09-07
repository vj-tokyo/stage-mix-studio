import { useState, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Plus, X, Play, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { useMixerStore, VideoLibraryItem } from '@/store/mixerStore';

interface VideoLibraryProps {
  onSelectVideo: (videoSrc: string) => void;
}

export const VideoLibrary: React.FC<VideoLibraryProps> = ({ onSelectVideo }) => {
  const { videoLibrary, addVideoToLibrary, removeVideoFromLibrary } = useMixerStore();
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateThumbnail = (videoFile: File): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.addEventListener('loadedmetadata', () => {
        canvas.width = 160;
        canvas.height = 90;
        video.currentTime = 1; // Capture at 1 second
      });

      video.addEventListener('seeked', () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        }
      });

      video.src = URL.createObjectURL(videoFile);
    });
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const url = URL.createObjectURL(file);
      
      // Add to library immediately with loading state
      addVideoToLibrary({
        id,
        name: file.name,
        url,
        isUploading: true,
      });

      try {
        const thumbnail = await generateThumbnail(file);
        const video = document.createElement('video');
        video.src = url;
        
        video.addEventListener('loadedmetadata', () => {
          // Update with complete info
          addVideoToLibrary({
            id,
            name: file.name,
            url,
            thumbnail,
            duration: video.duration,
            resolution: `${video.videoWidth}x${video.videoHeight}`,
            isUploading: false,
          });
        });
      } catch (error) {
        // Update with error state
        addVideoToLibrary({
          id,
          name: file.name,
          url,
          error: 'Failed to process video',
          isUploading: false,
        });
      }
    }
  };

  const handleUrlAdd = () => {
    if (!urlInput.trim()) return;

    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    addVideoToLibrary({
      id,
      name: `URL Video ${id.substr(-4)}`,
      url: urlInput.trim(),
    });
    
    setUrlInput('');
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Video Library</h3>
        <span className="text-sm text-muted-foreground">({videoLibrary.length} videos)</span>
      </div>

      {/* Upload Controls */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Files
        </Button>
        
        <div className="flex flex-1 gap-2">
          <Input
            placeholder="Video URL..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUrlAdd()}
          />
          <Button onClick={handleUrlAdd} disabled={!urlInput.trim()}>
            Add URL
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Video Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {videoLibrary.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative group bg-card rounded-lg p-2 border border-border hover:border-primary/50 transition-all"
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-muted rounded mb-2 overflow-hidden relative">
                {item.thumbnail ? (
                  <img 
                    src={item.thumbnail} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    {item.isUploading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                    ) : (
                      <Play className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                )}
                
                {/* Overlay Controls */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onSelectVideo(item.url)}
                  >
                    <Play className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeVideoFromLibrary(item.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-1">
                <p className="text-xs font-medium truncate">{item.name}</p>
                {item.resolution && (
                  <p className="text-xs text-muted-foreground">{item.resolution}</p>
                )}
                {item.duration && (
                  <p className="text-xs text-muted-foreground">
                    {Math.floor(item.duration / 60)}:{Math.floor(item.duration % 60).toString().padStart(2, '0')}
                  </p>
                )}
                {item.error && (
                  <p className="text-xs text-destructive">{item.error}</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {videoLibrary.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No videos in library. Upload files or add URLs to get started.</p>
        </div>
      )}
    </div>
  );
};