# LLM Integration with LiteLLM

iDocument has been enhanced to support multiple Large Language Model (LLM) providers through the [LiteLLM](https://github.com/BerriAI/litellm) library. This integration enables you to use various LLM providers such as OpenAI, Anthropic, Azure OpenAI, and more, while also providing cost monitoring and usage tracking.

## Features

- Support for multiple LLM providers through a unified API
- LLM provider and model configuration through UI
- Usage tracking and cost monitoring
- Fallback mechanisms for reliability

## Configuration

LLM providers and models are configured through the settings page in the dashboard. You can:

1. Add new LLM providers with API keys and base URLs
2. Configure models for different providers
3. Set default models for different tasks
4. View usage statistics and costs

## Database Schema

The LLM integration uses the following database tables:

- `llm_providers`: Stores LLM providers configuration (API keys, base URLs)
- `llm_models`: Stores models configuration for each provider
- `llm_usage`: Tracks usage data including tokens, costs, and response times

## Running Migrations

To set up the database tables for LLM integration, run:

```bash
npm run db:migrate
```

This will execute the SQL migrations in the `lib/supabase/migrations` directory.

## Implementation Details

### Provider Abstraction

The LLM integration uses a provider abstraction layer in `lib/ai/llm-provider.ts` which:

1. Loads provider configuration from the database
2. Initializes connections to LLM providers
3. Provides a unified API for calling different models
4. Tracks usage and costs

### Usage Monitoring

Usage monitoring is implemented through:

1. Automatic tracking of tokens and costs for each request
2. Storage of usage data in the `llm_usage` table
3. API endpoints for retrieving usage statistics
4. Dashboard UI for visualizing usage and costs

## Adding New Providers

To add support for a new LLM provider:

1. Add the provider through the LLM settings UI
2. Configure the API key and endpoint
3. Add models for the provider
4. Set default models for different tasks

## Cost Calculation

Costs are calculated based on a pricing table defined in the `calculateCost` method in `lib/ai/llm-provider.ts`. The pricing is based on the number of tokens used for both input and output, with different models having different pricing tiers.

## Environment Variables

The following environment variables can be used to configure the default LLM behavior:

- `OPENAI_API_KEY`: Default OpenAI API key
- `ANTHROPIC_API_KEY`: Default Anthropic API key
- `AZURE_API_KEY`: Default Azure OpenAI API key

These environment variables are only used as fallbacks if no provider is configured in the database. 