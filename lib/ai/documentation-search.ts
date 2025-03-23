import { db } from "@/lib/supabase/db";
import { Documentation, DocumentationDiagram } from "./types";
import { edgeCodeAnalysisModel } from "./models";

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
 * Searches documentation using advanced search capabilities
 */
export async function searchDocumentation(
  params: DocSearchParams
): Promise<DocSearchResult[]> {
  try {
    // Start with a basic SQL query
    const { query, repositoryId, userId, tags, componentTypes, dateFrom, dateTo, limit = 10, offset = 0 } = params;
    
    // First do a basic database search
    let dbQuery = db
      .select({
        dr: 'documentation_requests.*',
        r: 'repositories.name as repository_name',
      })
      .from('documentation_requests as dr')
      .leftJoin('repositories as r', 'dr.repository_id', 'r.id')
      .where('dr.status', '=', 'completed')
      .limit(limit)
      .offset(offset)
      .orderBy('dr.updated_at', 'desc');
    
    // Add filters
    if (repositoryId) {
      dbQuery = dbQuery.where('dr.repository_id', '=', repositoryId);
    }
    
    if (userId) {
      dbQuery = dbQuery.where('dr.user_id', '=', userId);
    }
    
    if (dateFrom) {
      dbQuery = dbQuery.where('dr.created_at', '>=', dateFrom);
    }
    
    if (dateTo) {
      dbQuery = dbQuery.where('dr.created_at', '<=', dateTo);
    }
    
    // Execute the query
    const rawResults = await dbQuery;
    
    if (rawResults.length === 0) {
      return [];
    }
    
    // Get documentation content from results
    const documentations = rawResults.map(row => {
      try {
        const result = JSON.parse(row.dr.result || '{}');
        return {
          documentationId: row.dr.id,
          repositoryId: row.dr.repository_id,
          repositoryName: row.repository_name,
          documentation: result.documentation,
          diagrams: result.diagrams,
          createdAt: row.dr.created_at,
          updatedAt: row.dr.updated_at,
          pullRequestId: row.dr.pull_request_id || undefined,
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
      if (docContent.overview) {
        searchableText += docContent.overview + '\n\n';
      }
      
      // Add architecture
      if (docContent.architecture) {
        searchableText += docContent.architecture + '\n\n';
      }
      
      // Add components
      if (docContent.components && docContent.components.length > 0) {
        docContent.components.forEach(component => {
          searchableText += `Component: ${component.componentId}\n`;
          searchableText += `${component.description}\n`;
          searchableText += `Usage: ${component.usage || 'N/A'}\n\n`;
        });
      }
      
      // Add usage guide
      if (docContent.usageGuide) {
        searchableText += docContent.usageGuide + '\n\n';
      }
      
      return {
        ...doc,
        searchableText,
        components: docContent.components || [],
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
          // Try to extract JSON from the response
          const jsonMatch = relevanceResponse.match(/```json\n([\s\S]*?)\n```/) ||
                           relevanceResponse.match(/\{[\s\S]*\}/);
                           
          const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : relevanceResponse;
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
      } catch (e) {
        console.error("Error ranking documentation:", e);
        return null;
      }
    }));
    
    // Filter out failures and sort by relevance
    return searchResults
      .filter(Boolean)
      .sort((a, b) => b.relevance - a.relevance);
  } catch (error) {
    console.error("Error in semantic search:", error);
    return [];
  }
}

/**
 * Suggest related documentation based on current documentation
 */
export async function getSuggestedDocumentation(
  documentationId: string,
  limit: number = 5
): Promise<DocSearchResult[]> {
  try {
    // Get the current documentation
    const { db } = await import("@/lib/supabase/db");
    const docResult = await db
      .select('*')
      .from('documentation_requests')
      .where({ id: documentationId })
      .single();
    
    if (!docResult || !docResult.result) {
      return [];
    }
    
    const parsedResult = JSON.parse(docResult.result);
    
    // Create a query based on key concepts from the documentation
    const documentation = parsedResult.documentation;
    
    if (!documentation || !documentation.overview) {
      return [];
    }
    
    // Extract key terms from the documentation overview
    const overviewText = documentation.overview;
    const componentNames = (documentation.components || [])
      .map(c => c.componentId)
      .join(', ');
    
    // Create a search query from the overview and component names
    const searchQuery = `${overviewText.split('.')[0]}. Components: ${componentNames}`;
    
    // Search for related documentation
    const results = await searchDocumentation({
      query: searchQuery,
      limit,
      offset: 0,
      repositoryId: docResult.repository_id,
    });
    
    // Filter out the current documentation
    return results.filter(result => result.documentationId !== documentationId);
  } catch (error) {
    console.error("Error getting suggested documentation:", error);
    return [];
  }
} 