/*
  # Create Weekend Planner Database Schema

  1. New Tables
    - places: Store all places of interest with comprehensive details
    - screenshots: Track uploaded images and processing status
    - user_preferences: User settings and home location
    - weekend_plans: Planned weekend activities

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (simplified for MVP)
*/

-- Create places table
CREATE TABLE IF NOT EXISTS places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  overview text,
  address text,
  google_maps_url text,
  distance_miles numeric,
  drive_time_minutes integer,
  category text,
  subcategory text,
  key_highlights text,
  insider_tips text,
  entry_fee text,
  average_spend integer,
  best_seasons text,
  best_day text,
  parking_info text,
  ev_charging text,
  google_rating numeric,
  tripadvisor_rating numeric,
  overall_sentiment text,
  nearby_restaurants jsonb DEFAULT '[]'::jsonb,
  average_visit_duration text,
  upcoming_events text,
  research_sources text,
  visited boolean DEFAULT false,
  visited_date date,
  user_notes text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create screenshots table
CREATE TABLE IF NOT EXISTS screenshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text,
  image_data text,
  processing_status text DEFAULT 'pending',
  extracted_data jsonb DEFAULT '{}'::jsonb,
  confidence_score numeric,
  place_id uuid REFERENCES places(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_address text,
  home_latitude numeric,
  home_longitude numeric,
  default_max_distance integer DEFAULT 100,
  preferred_categories jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create weekend_plans table
CREATE TABLE IF NOT EXISTS weekend_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_date date NOT NULL,
  places jsonb DEFAULT '[]'::jsonb,
  notes text,
  status text DEFAULT 'planned',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_places_category ON places(category);
CREATE INDEX IF NOT EXISTS idx_places_visited ON places(visited);
CREATE INDEX IF NOT EXISTS idx_places_distance ON places(distance_miles);
CREATE INDEX IF NOT EXISTS idx_screenshots_status ON screenshots(processing_status);
CREATE INDEX IF NOT EXISTS idx_weekend_plans_date ON weekend_plans(plan_date);

-- Enable Row Level Security
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekend_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (MVP - will restrict later)
CREATE POLICY "Allow public read access to places"
  ON places FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to places"
  ON places FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to places"
  ON places FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from places"
  ON places FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to screenshots"
  ON screenshots FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to screenshots"
  ON screenshots FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to screenshots"
  ON screenshots FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to user_preferences"
  ON user_preferences FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to user_preferences"
  ON user_preferences FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to user_preferences"
  ON user_preferences FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to weekend_plans"
  ON weekend_plans FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to weekend_plans"
  ON weekend_plans FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to weekend_plans"
  ON weekend_plans FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from weekend_plans"
  ON weekend_plans FOR DELETE
  TO public
  USING (true);