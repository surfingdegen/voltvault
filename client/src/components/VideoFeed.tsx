import { useEffect, useState, useRef } from 'react';
import { VideoPlayer } from './VideoPlayer';
import type { Video } from '../types';

export const VideoFeed = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const isScrolling = useRef<boolean>(false);

  const API_URL = '';

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await fetch(`${API_URL}/api/videos`);
      const data = await response.json();
      
      // Randomize video order
      const shuffled = data.sort(() => Math.random() - 0.5);
      
      setVideos(shuffled);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setLoading(false);
    }
  };

  const scrollToIndex = (index: number) => {
    if (isScrolling.current) return;
    
    isScrolling.current = true;
    setCurrentIndex(index);
    
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: index * window.innerHeight,
        behavior: 'smooth'
      });
    }

    setTimeout(() => {
      isScrolling.current = false;
    }, 500);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (isScrolling.current) return;

    if (e.deltaY > 0 && currentIndex < videos.length - 1) {
      scrollToIndex(currentIndex + 1);
    } else if (e.deltaY < 0 && currentIndex > 0) {
      scrollToIndex(currentIndex - 1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isScrolling.current) return;
    
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;

    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < videos.length - 1) {
        scrollToIndex(currentIndex + 1);
      } else if (diff < 0 && currentIndex > 0) {
        scrollToIndex(currentIndex - 1);
      }
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gray-600 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <p className="text-white text-xl">No videos available yet</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-screen w-screen overflow-y-scroll snap-y snap-mandatory"
      style={{ scrollSnapType: 'y mandatory', scrollBehavior: 'smooth' }}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {videos.map((video, index) => (
        <div
          key={video.id}
          className="h-screen w-screen snap-start snap-always"
        >
          <VideoPlayer 
            video={video} 
            isActive={index === currentIndex}
            shouldPreload={index === currentIndex + 1}
          />
        </div>
      ))}
    </div>
  );
};
