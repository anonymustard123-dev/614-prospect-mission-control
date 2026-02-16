-- Migration: Add icon_key and color fields to modules table
-- Run this in your Supabase SQL Editor if these columns don't exist

-- Add icon_key column for custom icon selection
ALTER TABLE modules 
ADD COLUMN IF NOT EXISTS icon_key TEXT;

-- Add color column for custom module colors
ALTER TABLE modules 
ADD COLUMN IF NOT EXISTS color TEXT;

-- Create index for icon_key if needed (optional)
-- CREATE INDEX IF NOT EXISTS idx_modules_icon_key ON modules(icon_key);
