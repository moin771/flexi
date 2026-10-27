/*
# Add image_url column to bikes

1. Modified Tables
- `bikes` — add `image_url` (text, nullable) to store a real photograph URL per bike.
2. Security
- No policy changes; existing CRUD grants already cover the new column (table-level grants include all columns).
3. Notes
- The column is nullable so existing rows remain valid until we backfill image URLs in a separate data step.
*/

ALTER TABLE bikes ADD COLUMN IF NOT EXISTS image_url text;
