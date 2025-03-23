#!/usr/bin/env ts-node
/**
 * Test script for documentation generation
 * 
 * This script runs a complete documentation generation process on a sample repository
 * and validates the output. It's useful for manual testing and debugging.
 * 
 * Usage:
 * npm run test:docs
 * 
 * Or directly:
 * ts-node scripts/test-documentation-generation.ts
 */

import { startDocumentationGeneration } from '../lib/ai/documentation-generator';
import { db } from '../lib/supabase/db';
import { documentationRequests } from '../lib/supabase/schema';
import { randomUUID } from 'crypto';

// Sample repository to document
const TEST_REPO = {
  owner: 'shadcn',
  repo: 'ui',
  branch: 'main',
};

// Utility to wait for a specified time
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Utility to print colorful status messages
const log = {
  info: (msg: string) => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`),
  success: (msg: string) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`),
  error: (msg: string) => console.log(`\x1b[31m[ERROR]\x1b[0m ${msg}`),
  warning: (msg: string) => console.log(`\x1b[33m[WARNING]\x1b[0m ${msg}`),
};

// Main test function
async function runDocumentationTest() {
  try {
    log.info('Starting documentation generation test...');
    
    // Create a test repository record
    log.info(`Using test repository: ${TEST_REPO.owner}/${TEST_REPO.repo}`);
    const repositoryId = randomUUID();
    
    // Create a documentation request
    const documentationId = randomUUID();
    log.info(`Creating documentation request with ID: ${documentationId}`);
    
    await db.insert(documentationRequests).values({
      id: documentationId,
      repository_id: repositoryId,
      owner: TEST_REPO.owner,
      repo: TEST_REPO.repo,
      branch: TEST_REPO.branch,
      status: 'pending',
      progress: 0,
      created_at: new Date().toISOString(),
    });
    
    // Start the documentation generation process
    log.info('Starting documentation generation process...');
    await startDocumentationGeneration({
      documentationId,
      repositoryId,
      owner: TEST_REPO.owner,
      repo: TEST_REPO.repo,
      branch: TEST_REPO.branch,
      filePaths: [], // We'll let the webhook discover files
      userId: 'test-user',
    });
    
    // Poll for completion
    log.info('Documentation generation started, polling for completion...');
    let isComplete = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 30; // Max 5 minutes (10 seconds * 30)
    
    while (!isComplete && attempts < MAX_ATTEMPTS) {
      attempts++;
      
      // Get the current status
      const docRequest = await db.query.documentationRequests.findFirst({
        where: (documentationRequests, { eq }) => eq(documentationRequests.id, documentationId)
      });
      
      if (!docRequest) {
        log.error('Documentation request not found!');
        process.exit(1);
      }
      
      const status = docRequest.status;
      const progress = docRequest.progress || 0;
      
      log.info(`Status: ${status}, Progress: ${progress}% (Attempt ${attempts}/${MAX_ATTEMPTS})`);
      
      if (status === 'completed') {
        isComplete = true;
        log.success('Documentation generation completed successfully!');
        
        // Display the result
        try {
          const result = JSON.parse(docRequest.result as string);
          log.info('Documentation result summary:');
          console.log('--------------------------');
          console.log(`Overview: ${result.documentation?.overview?.substring(0, 100)}...`);
          console.log(`Components: ${result.documentation?.components?.length || 0}`);
          console.log(`Quality score: ${result.qualityAssessment?.score || 0}`);
          console.log(`Missing docs: ${result.missingDocs?.length || 0}`);
          console.log(`Diagrams: ${result.diagrams?.length || 0}`);
          console.log('--------------------------');
        } catch (e) {
          log.error(`Failed to parse result: ${e}`);
        }
        
        break;
      } else if (status === 'failed') {
        log.error(`Documentation generation failed: ${docRequest.result}`);
        process.exit(1);
      }
      
      // Wait before checking again
      await wait(10000); // 10 seconds between checks
    }
    
    if (!isComplete) {
      log.warning('Documentation generation timed out!');
      process.exit(1);
    }
    
    // Clean up test data
    if (process.env.KEEP_TEST_DATA !== 'true') {
      log.info('Cleaning up test data...');
      await db.delete(documentationRequests)
        .where((documentationRequests, { eq }) => eq(documentationRequests.id, documentationId));
      log.info('Test data cleaned up.');
    } else {
      log.info('Test data kept for inspection.');
    }
    
    log.success('Test completed successfully!');
    process.exit(0);
  } catch (error) {
    log.error(`Test failed: ${(error as Error).message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the test if executed directly
if (require.main === module) {
  runDocumentationTest();
}

export { runDocumentationTest }; 