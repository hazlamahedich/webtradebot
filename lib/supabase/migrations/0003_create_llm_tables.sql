-- Create LLM provider table
CREATE TABLE IF NOT EXISTS llm_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  api_key TEXT NOT NULL,
  api_base TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create LLM models table
CREATE TABLE IF NOT EXISTS llm_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  model_id TEXT NOT NULL,
  provider_id UUID NOT NULL REFERENCES llm_providers(id),
  max_tokens INTEGER DEFAULT 4096,
  is_default BOOLEAN DEFAULT FALSE,
  tasks JSONB DEFAULT '["generation"]'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create LLM usage tracking table
CREATE TABLE IF NOT EXISTS llm_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id),
  model_id TEXT NOT NULL,
  model_name TEXT NOT NULL,
  provider_id UUID REFERENCES llm_providers(id),
  feature TEXT NOT NULL,
  request_id TEXT,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  cost REAL NOT NULL,
  duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_llm_usage_model_id ON llm_usage(model_id);
CREATE INDEX IF NOT EXISTS idx_llm_usage_feature ON llm_usage(feature);
CREATE INDEX IF NOT EXISTS idx_llm_usage_created_at ON llm_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_llm_usage_user_id ON llm_usage(user_id);

-- Insert default OpenAI provider if not exists
INSERT INTO llm_providers (name, api_key, is_default)
SELECT 'OpenAI', current_setting('app.openai_api_key', true), TRUE
WHERE NOT EXISTS (SELECT 1 FROM llm_providers WHERE name = 'OpenAI');

-- Insert default models if not exists
INSERT INTO llm_models (name, model_id, provider_id, is_default, tasks)
SELECT 'GPT-4o', 'gpt-4o', (SELECT id FROM llm_providers WHERE name = 'OpenAI' LIMIT 1), TRUE, '["generation"]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM llm_models WHERE model_id = 'gpt-4o');

INSERT INTO llm_models (name, model_id, provider_id, tasks)
SELECT 'GPT-3.5 Turbo', 'gpt-3.5-turbo', (SELECT id FROM llm_providers WHERE name = 'OpenAI' LIMIT 1), '["generation"]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM llm_models WHERE model_id = 'gpt-3.5-turbo');

INSERT INTO llm_models (name, model_id, provider_id, tasks)
SELECT 'Text Embedding 3 Large', 'text-embedding-3-large', (SELECT id FROM llm_providers WHERE name = 'OpenAI' LIMIT 1), '["embedding"]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM llm_models WHERE model_id = 'text-embedding-3-large'); 