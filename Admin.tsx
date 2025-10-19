import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Upload, LogOut } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const videoFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  categoryId: z.string().min(1, "Category is required"),
  url: z.string().url("Must be a valid URL"),
});

const categoryFormSchema = z.object({
  name: z.string().min(1, "Category name is required"),
});

type VideoFormData = z.infer<typeof videoFormSchema>;
type CategoryFormData = z.infer<typeof categoryFormSchema>;

interface Video {
  id: string;
  title: string;
  category_id: string;
  url: string;
}

interface Category {
  id: string;
  name: string;
  count: number;
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTitle, setSelectedTitle] = useState<string>("all");
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const authToken = localStorage.getItem('adminToken');

  const { data: auth, isLoading: isCheckingAuth } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      const response = await fetch('/api/auth?action=me', {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      });
      if (!response.ok) throw new Error('Not authenticated');
      return response.json();
    },
    retry: false,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      return response.json();
    },
  });

  const { data: videos = [] } = useQuery<Video[]>({
    queryKey: ['/api/videos'],
    queryFn: async () => {
      const response = await fetch('/api/videos');
      return response.json();
    },
  });

  useEffect(() => {
    if (!isCheckingAuth && !auth) {
      setLocation("/login");
    }
  }, [auth, isCheckingAuth, setLocation]);

  const form = useForm<VideoFormData>({
    resolver: zodResolver(videoFormSchema),
    defaultValues: {
      title: "",
      categoryId: "",
      url: "",
    },
  });

  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (categories.length > 0 && !form.getValues('categoryId')) {
      form.setValue('categoryId', categories[0].id);
    }
  }, [categories, form]);

  const addVideoMutation = useMutation({
    mutationFn: async (data: VideoFormData) => {
      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          categoryId: data.categoryId,
          url: data.url
        }),
      });
      if (!response.ok) throw new Error('Failed to add video');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      form.reset({
        title: "",
        categoryId: categories[0]?.id || "",
        url: "",
      });
      setUploadedVideoUrl("");
      toast({
        title: "Success",
        description: "Video added successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add video",
      });
    },
  });

  const addCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to add category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      categoryForm.reset();
      toast({
        title: "Success",
        description: "Category added successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add category",
      });
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/videos?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete video');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: "Success",
        description: "Video deleted successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete video",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch('/api/auth?action=logout', { method: 'POST' });
      localStorage.removeItem('adminToken');
    },
    onSuccess: () => {
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      setLocation("/login");
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please upload a video file",
      });
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Video must be less than 500MB",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('video', file);

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
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const { url } = await response.json();
      setUploadedVideoUrl(url);
      form.setValue('url', url);

      toast({
        title: "Upload Complete",
        description: "Video uploaded successfully!",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: error instanceof Error ? error.message : "Failed to upload video",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const onSubmit = (data: VideoFormData) => {
    addVideoMutation.mutate(data);
  };

  const onCategorySubmit = (data: CategoryFormData) => {
    addCategoryMutation.mutate(data);
  };

  const filteredVideos = selectedCategory === 'all'
    ? videos
    : videos.filter(v => v.category_id === selectedCategory);

  const finalFilteredVideos = selectedTitle === 'all'
    ? filteredVideos
    : filteredVideos.filter(v => v.title === selectedTitle);

  const uniqueTitles = Array.from(new Set(videos.map(v => v.title)));

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Admin Panel</h1>
          <Button
            onClick={() => logoutMutation.mutate()}
            variant="outline"
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Add Video</h2>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-white">Title</Label>
                <Input
                  id="title"
                  {...form.register("title")}
                  className="bg-white/20 text-white border-white/30"
                  placeholder="Enter video title"
                />
                {form.formState.errors.title && (
                  <p className="text-red-400 text-sm mt-1">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="category" className="text-white">Category</Label>
                <Select
                  value={form.watch("categoryId")}
                  onValueChange={(value) => form.setValue("categoryId", value)}
                >
                  <SelectTrigger className="bg-white/20 text-white border-white/30">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="video-upload" className="text-white">Upload Video</Label>
                <div className="mt-2">
                  <Input
                    id="video-upload"
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="bg-white/20 text-white border-white/30 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                  />
                  {isUploading && (
                    <div className="mt-2">
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-white text-sm mt-1">Uploading... {uploadProgress}%</p>
                    </div>
                  )}
                  {uploadedVideoUrl && (
                    <p className="text-green-400 text-sm mt-2">✓ Video uploaded successfully</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="url" className="text-white">Video URL</Label>
                <Input
                  id="url"
                  {...form.register("url")}
                  className="bg-white/20 text-white border-white/30"
                  placeholder="URL will be filled after upload"
                  readOnly
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={addVideoMutation.isPending || !uploadedVideoUrl}
              >
                <Upload className="w-4 h-4 mr-2" />
                Add Video
              </Button>
            </form>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Add Category</h2>
            <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4">
              <div>
                <Label htmlFor="category-name" className="text-white">Category Name</Label>
                <Input
                  id="category-name"
                  {...categoryForm.register("name")}
                  className="bg-white/20 text-white border-white/30"
                  placeholder="Enter category name"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={addCategoryMutation.isPending}
              >
                Add Category
              </Button>
            </form>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-white mb-2">Existing Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category.id} className="bg-white/10 rounded p-2 text-white">
                    {category.name} ({category.count})
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Manage Videos</h2>
          
          <div className="flex gap-4 mb-6">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48 bg-white/20 text-white border-white/30">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTitle} onValueChange={setSelectedTitle}>
              <SelectTrigger className="w-48 bg-white/20 text-white border-white/30">
                <SelectValue placeholder="All Titles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Titles</SelectItem>
                {uniqueTitles.map((title) => (
                  <SelectItem key={title} value={title}>
                    {title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {finalFilteredVideos.map((video) => (
              <div key={video.id} className="bg-white/20 rounded-lg p-4">
                <video
                  src={video.url}
                  className="w-full h-48 object-cover rounded mb-2"
                  controls
                />
                <h3 className="text-white font-semibold">{video.title}</h3>
                <p className="text-white/70 text-sm">
                  {categories.find(c => c.id === video.category_id)?.name}
                </p>
                <Button
                  onClick={() => setVideoToDelete(video.id)}
                  variant="destructive"
                  size="sm"
                  className="mt-2 w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            ))}
          </div>

          {finalFilteredVideos.length === 0 && (
            <p className="text-white/70 text-center py-8">No videos found</p>
          )}
        </div>
      </div>

      <AlertDialog open={!!videoToDelete} onOpenChange={() => setVideoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this video? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (videoToDelete) {
                  deleteVideoMutation.mutate(videoToDelete);
                  setVideoToDelete(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
