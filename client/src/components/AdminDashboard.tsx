import { useState, useEffect } from 'react';

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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videos, setVideos] = useState<Video[]>([]);

  useEffect(() => {
    loadVideos();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadVideo(file);
    }
  };

  const uploadVideo = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('video', file);

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(95);

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const { url } = await uploadResponse.json();

      const randomTitle = `Video ${Math.random().toString(36).substring(7)}`;

      const addResponse = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: randomTitle,
          categoryId: null,
          url: url,
        }),
      });

      if (!addResponse.ok) {
        throw new Error('Failed to add video to database');
      }

      setUploadProgress(100);
      alert('Video uploaded successfully!');
      loadVideos();
    } catch (error) {
      alert('Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
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

  const deleteVideo = async (id: string) => {
    if (!confirm('Delete this video?')) return;

    try {
      const response = await fetch(`/api/videos?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Video deleted');
        loadVideos();
      }
    } catch (error) {
      alert('Delete failed');
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
          <input 
            type="file" 
            accept="video/*"
            onChange={handleFileSelect}
            disabled={isUploading}
            style={{
              padding: '15px',
              backgroundColor: '#7c3aed',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          />
          <p style={{ marginTop: '10px', fontSize: '14px', opacity: 0.7 }}>
            Choose .mov or .mp4 file. Max 100MB.
          </p>
        </div>

        {isUploading && (
          <div>
            <div style={{ 
              width: '100%', 
              backgroundColor: 'rgba(255,255,255,0.2)', 
              borderRadius: '10px', 
              height: '20px',
              marginBottom: '10px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: `${uploadProgress}%`, 
                backgroundColor: '#7c3aed', 
                height: '100%',
                transition: 'width 0.3s'
              }} />
            </div>
            <p style={{ textAlign: 'center' }}>Uploading... {uploadProgress}%</p>
          </div>
        )}
      </div>

      <div style={{ 
        backgroundColor: 'rgba(255,255,255,0.1)', 
        padding: '30px', 
        borderRadius: '10px'
      }}>
        <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Uploaded Videos ({videos.length})</h2>

        <div>
          {videos.map(video => (
            <div key={video.id} style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '15px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <p style={{ fontSize: '14px', opacity: 0.7 }}>Uploaded: {new Date(video.created_at).toLocaleDateString()}</p>
                <p style={{ fontSize: '12px', opacity: 0.5, marginTop: '5px', wordBreak: 'break-all' }}>{video.url}</p>
              </div>
              <button
                onClick={() => deleteVideo(video.id)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  marginLeft: '20px'
                }}
              >
                Delete
              </button>
            </div>
          ))}

          {videos.length === 0 && (
            <p style={{ textAlign: 'center', opacity: 0.5, padding: '40px' }}>
              No videos uploaded yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
