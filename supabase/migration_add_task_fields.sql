-- Migration: Add description, parent_id, and color fields to tasks table
-- Run this in your Supabase SQL Editor if these columns don't exist

-- Add description column
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add parent_id column for subtasks
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE;

-- Add color column for custom task colors
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS color TEXT;

-- Create index for parent_id for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id);
