-- Fix the repositories table schema
ALTER TABLE repositories
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS language TEXT,
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS url TEXT;

-- Add timestamp columns if they don't exist
ALTER TABLE repositories
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Fix column naming conventions if needed
DO $$
BEGIN
  -- Check if 'userId' exists and 'user_id' doesn't
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'repositories' AND column_name = 'userid'
  ) AND NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'repositories' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE repositories RENAME COLUMN userid TO user_id;
  END IF;
  
  -- Check if 'fullName' exists and 'full_name' doesn't
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'repositories' AND column_name = 'fullname'
  ) AND NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'repositories' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE repositories RENAME COLUMN fullname TO full_name;
  END IF;
  
  -- Check if 'isPrivate' exists and 'is_private' doesn't
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'repositories' AND column_name = 'isprivate'
  ) AND NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'repositories' AND column_name = 'is_private'
  ) THEN
    ALTER TABLE repositories RENAME COLUMN isprivate TO is_private;
  END IF;
END
$$; 