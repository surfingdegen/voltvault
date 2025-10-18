import { useState, useEffect } from 'react';
import { Upload, Trash2, LogOut } from 'lucide-react';
import type { Video } from '../types';

interface AdminDashboardProps {
  token: string;
  onLogout: () => void;
}

export const AdminDashboard = ({ token, onLogout }: AdminDashboardProps) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [uploading, setUploading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    const response = await fetch(`${API_URL}/api/videos`);
    const data = await response.json();
    setVideos(data);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', `Video ${Date.now()}`);
    formData.append('categoryId', '1');

    try {
      const response = await fetch(`${API_URL}/api/videos/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        alert('Video uploaded successfully!');
        fetchVideos();
        e.target.value = '';
      } else {
        alert('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const deleteVideo = async (id: number) => {
    if (!confirm('Delete this video?')) return;

    try {
      await fetch(`${API_URL}/api/videos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      fetchVideos();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>

        {/* Upload Section */}
        <div className="bg-gray-900 rounded-lg p-8 mb-8 border-2 border-dashed border-gray-700">
          <h2 className="text-2xl font-bold mb-4">Upload Video</h2>
          <label className="cursor-pointer block">
            <div className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg flex items-center justify-center gap-3 font-semibold">
              <Upload size={24} />
              {uploading ? 'Uploading...' : 'Choose .mov or .mp4 file'}
            </div>
            <input
              type="file"
              accept=".mov,.mp4,.MOV,.MP4"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
          <p className="text-gray-400 text-sm mt-2">
            Drag and drop or click to upload. Max 100MB.
          </p>
        </div>

        {/* Videos List */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Uploaded Videos ({videos.length})</h2>
          <div className="space-y-3">
            {videos.map((video, index) => (
              <div key={video.id} className="flex justify-between items-center bg-gray-800 p-4 rounded-lg">
                <div>
                  <h3 className="font-semibold">Video {index + 1}</h3>
                  <p className="text-sm text-gray-400">
                    Uploaded: {new Date(video.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => deleteVideo(video.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
