import { useState } from 'react';

interface Video {
  id: string;
  title: string;
  url: string;
  category_id: string;
  created_at: string;
}

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [videos, setVideos] = useState<Video[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      alert('Please select a file first');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('video', uploadFile);

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { url } = await response.json();
      setUploadedVideoUrl(url);
      alert('Upload successful! URL: ' + url);
    } catch (error) {
      alert('Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleAddVideo = async () => {
    if (!title || !category || !uploadedVideoUrl) {
      alert('Please fill in all fields and upload a video first');
      return;
    }

    try {
      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          categoryId: category,
          url: uploadedVideoUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add video');
      }

      alert('Video added successfully!');
      setTitle('');
      setCategory('');
      setUploadedVideoUrl('');
      setUploadFile(null);
      loadVideos();
    } catch (error) {
      alert('Failed to add video: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const loadVideos = async () => {
    try {
      const response = await fetch('/api/videos');
      const data = await response.json();
      setVideos(data);
    } catch (error) {
      console.error('Failed to load videos:', error);
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#1a1a2e', minHeight: '100vh', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>Admin Dashboard</h1>
        <button 
          onClick={onLogout}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      <div style={{ 
        backgroundColor: 'rgba(255,255,255,0.1)', 
        padding: '30px', 
        borderRadius: '10px',
        marginBottom: '30px'
      }}>
        <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Upload Video</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px' }}>Choose Video File:</label>
          <input 
            type="file" 
            accept="video/*"
            onChange={handleFileSelect}
            disabled={isUploading}
            style={{
              padding: '10px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '5px',
              color: 'white',
              width: '100%'
            }}
          />
        </div>

        {uploadFile && !uploadedVideoUrl && (
          <button
            onClick={handleUpload}
            disabled={isUploading}
            style={{
              padding: '12px 24px',
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              marginBottom: '20px',
              opacity: isUploading ? 0.6 : 1
            }}
          >
            {isUploading ? `Uploading... ${uploadProgress}%` : 'Upload to Vercel Blob'}
          </button>
        )}

        {isUploading && (
          <div style={{ 
            width: '100%', 
            backgroundColor: 'rgba(255,255,255,0.2)', 
            borderRadius: '10px', 
            height: '10px',
            marginBottom: '20px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: `${uploadProgress}%`, 
              backgroundColor: '#7c3aed', 
              height: '100%',
              transition: 'width 0.3s'
            }} />
          </div>
        )}

        {uploadedVideoUrl && (
          <>
            <div style={{ 
              padding: '15px', 
              backgroundColor: 'rgba(34,197,94,0.2)', 
              borderRadius: '5px',
              marginBottom: '20px',
              color: '#4ade80'
            }}>
              ✓ Video uploaded successfully! URL: {uploadedVideoUrl}
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Title:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter video title"
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '5px',
                  color: 'white'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Category:</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Enter category ID"
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '5px',
                  color: 'white'
                }}
              />
            </div>

            <button
              onClick={handleAddVideo}
              style={{
                padding: '12px 24px',
                backgroundColor: '#22c55e',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Add Video to Database
            </button>
          </>
        )}
      </div>

      <div style={{ 
        backgroundColor: 'rgba(255,255,255,0.1)', 
        padding: '30px', 
        borderRadius: '10px'
      }}>
        <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Uploaded Videos</h2>
        <button 
          onClick={loadVideos}
          style={{
            padding: '10px 20px',
            backgroundColor: '#7c3aed',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginBottom: '20px'
          }}
        >
          Load Videos
        </button>

        <div>
          {videos.map(video => (
            <div key={video.id} style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '10px'
            }}>
              <h3 style={{ fontSize: '18px', marginBottom: '5px' }}>{video.title}</h3>
              <p style={{ fontSize: '14px', opacity: 0.7 }}>URL: {video.url}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
