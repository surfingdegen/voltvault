export interface Video {
  id: number;
  title: string;
  category_id: number;
  category_name: string;
  url: string;
  duration: string;
  display_order: number;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  created_at: string;
}

