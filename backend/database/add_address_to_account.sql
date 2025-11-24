-- Migration: Add address field to Account table
-- This field stores the user's address

-- Add address column to Account table
ALTER TABLE "Account" 
ADD COLUMN IF NOT EXISTS address VARCHAR(255);

