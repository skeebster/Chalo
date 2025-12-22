import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Place = {
  id: string;
  name: string;
  overview: string | null;
  address: string | null;
  google_maps_url: string | null;
  distance_miles: number | null;
  drive_time_minutes: number | null;
  category: string | null;
  subcategory: string | null;
  key_highlights: string | null;
  insider_tips: string | null;
  entry_fee: string | null;
  average_spend: number | null;
  best_seasons: string | null;
  best_day: string | null;
  parking_info: string | null;
  ev_charging: string | null;
  google_rating: number | null;
  tripadvisor_rating: number | null;
  overall_sentiment: string | null;
  nearby_restaurants: Array<{
    name: string;
    description: string;
    distance?: string;
  }>;
  average_visit_duration: string | null;
  upcoming_events: string | null;
  research_sources: string | null;
  visited: boolean;
  visited_date: string | null;
  user_notes: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Screenshot = {
  id: string;
  image_url: string | null;
  image_data: string | null;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  extracted_data: Record<string, any>;
  confidence_score: number | null;
  place_id: string | null;
  created_at: string;
};
