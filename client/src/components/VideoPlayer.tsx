import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import type { Video } from '../types';

interface VideoPlayerProps {
  video: Video;
  isActive: boolean;
}

export const VideoPlayer = ({ video, isActive }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!videoRef.current) return;

    if (isActive) {
      videoRef.current.play().catch(err => console.error('Play error:', err));
    } else {
      videoRef.current.pause();
    }
  }, [isActive]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-gray-600 border-t-white rounded-full animate-spin" />
        </div>
      )}

      <video
        ref={videoRef}
        src={video.url}
        className="w-full h-full object-contain"
        loop
        muted={isMuted}
        playsInline
        preload="auto"
        onLoadedData={() => setIsLoading(false)}
        onClick={toggleMute}
      />

      {/* Video Info Overlay - REMOVED */}

      {/* Mute Toggle */}
      <button
        onClick={toggleMute}
        className="absolute top-4 right-4 bg-black/50 p-3 rounded-full backdrop-blur-sm"
      >
        {isMuted ? (
          <VolumeX className="text-white" size={24} />
        ) : (
          <Volume2 className="text-white" size={24} />
        )}
      </button>

      {!isLoading && (
        <div className="absolute inset-0 cursor-pointer" onClick={toggleMute} />
      )}
    </div>
  );
};
