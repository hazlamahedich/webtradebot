import { db } from "@/lib/supabase/db";
import { Documentation, DocumentationDiagram } from "./types";
import { edgeCodeAnalysisModel } from "./models";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { documentationRequests, repositories } from "@/lib/supabase/schema";

/**
 * Interface for search parameters
 */
export interface DocSearchParams {
  query: string;
  repositoryId?: string;
  userId?: string;
  tags?: string[];
  componentTypes?: string[];
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

/**
 * Interface for search results
 */
export interface DocSearchResult {
  documentationId: string;
  repositoryId: string;
  repositoryName: string;
  title: string;
  relevance: number;
  createdAt: string;
  updatedAt: string;
  matchedComponents: string[];
  matchedContext: string;
  pullRequestId?: string;
}

/**
 * Retrieves the most recent documentation for a specific repository
 * @param repositoryId The repository ID to fetch documentation for
 * @returns The most recent documentation or null if not found
 */
export async function getDocumentationForRepository(
  repositoryId: string
): Promise<Documentation | null> {
  try {
    // Query for the most recent completed documentation for this repository
    const docRequest = await db.query.documentationRequests.findFirst({
      where: eq(documentationRequests.repository_id, repositoryId),
      orderBy: (requests, { desc }) => [desc(requests.created_at)],
    });
    
    if (!docRequest || !docRequest.result) {
      return null;
    }
    
    // Parse the result JSON to get the documentation
    const result = JSON.parse(docRequest.result.toString());
    
    return result.documentation || null;
  } catch (error) {
    console.error(`Error fetching documentation for repository ${repositoryId}:`, error);
    return null;
  }
}

/**
 * Searches documentation using advanced search capabilities
 */
export async function searchDocumentation(
  params: DocSearchParams
): Promise<DocSearchResult[]> {
  try {
    // Extract search parameters
    const { query, repositoryId, userId, tags, componentTypes, dateFrom, dateTo, limit = 10, offset = 0 } = params;
    
    // Build query conditions
    const whereConditions = [];
    
    // Add base condition for completed docs
    whereConditions.push(eq(documentationRequests.status, 'completed'));
    
    // Add filters
    if (repositoryId) {
      whereConditions.push(eq(documentationRequests.repository_id, repositoryId));
    }
    
    if (userId) {
      whereConditions.push(eq(documentationRequests.user_id, userId));
    }
    
    if (dateFrom) {
      whereConditions.push(gte(documentationRequests.created_at, new Date(dateFrom)));
    }
    
    if (dateTo) {
      whereConditions.push(lte(documentationRequests.created_at, new Date(dateTo)));
    }
    
    // Execute the query using the proper Drizzle syntax
    const rawResults = await db
      .select({
        id: documentationRequests.id,
        repository_id: documentationRequests.repository_id,
        result: documentationRequests.result,
        created_at: documentationRequests.created_at,
        updated_at: documentationRequests.created_at, // Using created_at as a fallback since there's no updated_at
        pull_request_id: sql<string>`null`, // Pull request ID is not directly available
        repository_name: repositories.name,
      })
      .from(documentationRequests)
      .leftJoin(repositories, eq(documentationRequests.repository_id, repositories.id))
      .where(and(...whereConditions))
      .limit(limit)
      .offset(offset)
      .orderBy(documentationRequests.created_at);
    
    if (rawResults.length === 0) {
      return [];
    }
    
    // Get documentation content from results
    const documentations = rawResults.map(row => {
      try {
        const parsedResult = row.result ? JSON.parse(row.result.toString()) : {};
        return {
          documentationId: row.id,
          repositoryId: row.repository_id,
          repositoryName: row.repository_name || row.repository_id, // Fallback to ID if name not available
          documentation: parsedResult.documentation,
          diagrams: parsedResult.diagrams,
          createdAt: row.created_at?.toISOString() || new Date().toISOString(),
          updatedAt: row.updated_at?.toISOString() || new Date().toISOString(),
          pullRequestId: row.pull_request_id,
        };
      } catch (e) {
        return null;
      }
    }).filter(Boolean);
    
    // If search query is provided, use semantic search to rank results
    if (query && query.trim() !== '') {
      return await semanticSearch(documentations, query);
    }
    
    // Otherwise, return basic metadata
    return documentations.map(doc => ({
      documentationId: doc.documentationId,
      repositoryId: doc.repositoryId,
      repositoryName: doc.repositoryName,
      title: doc.documentation?.overview?.split('\n')[0] || 'Untitled Documentation',
      relevance: 1,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      matchedComponents: [],
      matchedContext: doc.documentation?.overview?.substring(0, 200) + '...' || '',
      pullRequestId: doc.pullRequestId,
    }));
  } catch (error) {
    console.error("Error searching documentation:", error);
    throw new Error(`Failed to search documentation: ${(error as Error).message}`);
  }
}

/**
 * Performs semantic search on documentation content
 */
async function semanticSearch(
  documentations: any[],
  query: string
): Promise<DocSearchResult[]> {
  try {
    // Prepare docs for semantic search
    const docs = documentations.map(doc => {
      // Create a single searchable text from the documentation
      const docContent = doc.documentation;
      
      let searchableText = '';
      
      // Add overview
      if (docContent?.overview) {
        searchableText += docContent.overview + '\n\n';
      }
      
      // Add architecture
      if (docContent?.architecture) {
        searchableText += docContent.architecture + '\n\n';
      }
      
      // Add components
      if (docContent?.components && docContent.components.length > 0) {
        docContent.components.forEach((component: any) => {
          searchableText += `Component: ${component.componentId}\n`;
          searchableText += `${component.description}\n`;
          searchableText += `Usage: ${component.usage || 'N/A'}\n\n`;
        });
      }
      
      // Add usage guide
      if (docContent?.usageGuide) {
        searchableText += docContent.usageGuide + '\n\n';
      }
      
      return {
        ...doc,
        searchableText,
        components: docContent?.components || [],
      };
    });
    
    // Call the model to rank the docs based on query relevance
    const searchResults = await Promise.all(docs.map(async (doc) => {
      try {
        // Score relevance
        const relevancePrompt = `
        You are evaluating the relevance of a documentation to a search query.
        
        Search query: "${query}"
        
        Documentation content:
        ${doc.searchableText.substring(0, 4000)}
        
        Rate the relevance of this documentation to the search query on a scale of 0 to 100, where:
        - 0 means completely irrelevant
        - 100 means perfectly relevant
        
        Also identify the top 3 most relevant components or sections that match the query.
        
        Return your answer as a JSON object with the following structure:
        {
          "relevance": number between 0-100,
          "matchedComponents": [array of component names or section titles],
          "matchedContext": "a brief extract (200 chars max) from the documentation that best matches the query"
        }
        `;
        
        const relevanceResponse = await edgeCodeAnalysisModel.invoke(relevancePrompt);
        
        // Parse the JSON response
        let relevanceData;
        try {
          // Extract the content string from the AI response
          const responseText = typeof relevanceResponse === 'string' 
            ? relevanceResponse 
            : 'content' in relevanceResponse 
              ? typeof relevanceResponse.content === 'string' 
                ? relevanceResponse.content 
                : JSON.stringify(relevanceResponse.content)
              : JSON.stringify(relevanceResponse);
          
          // Try to extract JSON from the response text
          const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) ||
                           responseText.match(/\{[\s\S]*\}/);
                           
          const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : responseText;
          relevanceData = JSON.parse(jsonString);
        } catch (e) {
          console.error("Error parsing relevance data:", e);
          relevanceData = { relevance: 0, matchedComponents: [], matchedContext: "" };
        }
        
        return {
          documentationId: doc.documentationId,
          repositoryId: doc.repositoryId,
          repositoryName: doc.repositoryName,
          title: doc.documentation?.overview?.split('\n')[0] || 'Untitled Documentation',
          relevance: relevanceData.relevance || 0,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          matchedComponents: relevanceData.matchedComponents || [],
          matchedContext: relevanceData.matchedContext || doc.documentation?.overview?.substring(0, 200) + '...' || '',
          pullRequestId: doc.pullRequestId,
        };
      } catch (error) {
        console.error("Error in semantic search processing:", error);
        return null;
      }
    }));
    
    // Filter out any null results and sort by relevance
    return searchResults
      .filter(Boolean)
      .sort((a, b) => (b?.relevance || 0) - (a?.relevance || 0));
  } catch (error) {
    console.error("Error in semantic search:", error);
    return [];
  }
}

/**
 * Gets documentation suggestions based on similarity to a given documentation
 */
export async function getSuggestedDocumentation(
  documentationId: string,
  limit: number = 5
): Promise<DocSearchResult[]> {
  try {
    // Get the documentation to find similar ones
    const docRequest = await db.select()
      .from(documentationRequests)
      .where(eq(documentationRequests.id, documentationId))
      .limit(1);
    
    if (docRequest.length === 0) {
      return [];
    }
    
    const docData = docRequest[0];
    
    if (!docData.result) {
      return [];
    }
    
    // Parse the content
    const docResult = JSON.parse(docData.result.toString());
    const docContent = docResult.documentation;
    
    if (!docContent) {
      return [];
    }
    
    // Get other documentation for the same repository
    const repoId = docData.repository_id;
    
    // Query for other documentation from the same repository
    const otherDocs = await db.select({
        id: documentationRequests.id,
        repository_id: documentationRequests.repository_id,
        result: documentationRequests.result,
        created_at: documentationRequests.created_at,
        pull_request_id: sql<string>`null`, // Null as a placeholder
        repository_name: repositories.name,
      })
      .from(documentationRequests)
      .leftJoin(repositories, eq(documentationRequests.repository_id, repositories.id))
      .where(and(
        eq(documentationRequests.status, 'completed'),
        eq(documentationRequests.repository_id, repoId)
      ))
      .limit(limit + 1); // Get one extra to exclude current doc
    
    // Filter out the current documentation
    const filteredDocs = otherDocs.filter(doc => doc.id !== documentationId);
    
    // Map to proper format
    return filteredDocs.slice(0, limit).map(doc => {
      try {
        const result = doc.result ? JSON.parse(doc.result.toString()) : {};
        const docContent = result.documentation || {};
        
        return {
          documentationId: doc.id || '',
          repositoryId: doc.repository_id || '',
          repositoryName: doc.repository_name || doc.repository_id || '',
          title: docContent.overview?.split('\n')[0] || 'Untitled Documentation',
          relevance: 1, // Default relevance
          createdAt: doc.created_at?.toISOString() || new Date().toISOString(),
          updatedAt: doc.created_at?.toISOString() || new Date().toISOString(),
          matchedComponents: [],
          matchedContext: docContent.overview?.substring(0, 200) + '...' || '',
          pullRequestId: doc.pull_request_id,
        };
      } catch (e) {
        console.error("Error processing doc:", e);
        return null;
      }
    }).filter(Boolean);
  } catch (error) {
    console.error("Error getting suggested documentation:", error);
    return [];
  }
} 