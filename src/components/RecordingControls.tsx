import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Video, Square, Download, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useMixerStore } from '@/store/mixerStore';

type RecordingQuality = '720p' | '1080p';
type RecordingFormat = 'webm' | 'mp4';

export const RecordingControls: React.FC = () => {
  const { isRecording, toggleRecording } = useMixerStore();
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [quality, setQuality] = useState<RecordingQuality>('720p');
  const [format, setFormat] = useState<RecordingFormat>('webm');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const startRecording = useCallback(async () => {
    try {
      // Get the canvas from VideoCanvas component
      const canvas = document.querySelector('canvas');
      if (!canvas) {
        console.error('Canvas not found');
        return;
      }

      // Set up recording parameters based on quality
      const width = quality === '1080p' ? 1920 : 1280;
      const height = quality === '1080p' ? 1080 : 720;

      const stream = canvas.captureStream(30); // 30 FPS
      
      const mimeType = format === 'webm' ? 'video/webm;codecs=vp9' : 'video/mp4';
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        videoBitsPerSecond: quality === '1080p' ? 8000000 : 4000000, // 8Mbps for 1080p, 4Mbps for 720p
      });

      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
        chunksRef.current = [];
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms
      
      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toggleRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [quality, format, toggleRecording]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    toggleRecording();
  }, [toggleRecording]);

  const downloadRecording = useCallback(() => {
    if (!recordedBlob) return;
    
    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vj-mix-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setRecordedBlob(null);
  }, [recordedBlob, format]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="bg-card rounded-lg p-4 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
            <Video className="w-5 h-5" />
            Recording
          </h3>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Recording Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Quality</Label>
                  <Select value={quality} onValueChange={(value) => setQuality(value as RecordingQuality)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="720p">720p (recommended)</SelectItem>
                      <SelectItem value="1080p">1080p (high quality)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select value={format} onValueChange={(value) => setFormat(value as RecordingFormat)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="webm">WebM (VP9)</SelectItem>
                      <SelectItem value="mp4">MP4 (H.264)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {/* Recording Status */}
          {isRecording && (
            <div className="flex items-center justify-center gap-2 text-red-400 bg-red-500/10 rounded-lg p-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="font-mono text-lg">{formatTime(recordingTime)}</span>
              <span className="text-sm">REC</span>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-2">
            {!isRecording ? (
              <Button 
                onClick={startRecording}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                <Video className="w-4 h-4 mr-2" />
                Start Recording
              </Button>
            ) : (
              <Button 
                onClick={stopRecording}
                variant="secondary"
                className="flex-1"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop Recording
              </Button>
            )}

            {recordedBlob && (
              <Button
                onClick={downloadRecording}
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            <p>Recording at {quality} • Format: {format.toUpperCase()}</p>
            <p>Captures the live video mix in real-time</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};