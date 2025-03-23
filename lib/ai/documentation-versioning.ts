import { db } from '@/lib/supabase/db';
import { documentationRequests, documentationVersions } from '@/lib/supabase/schema';
import { Documentation } from './types';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a new version of documentation
 * @param docId The ID of the documentation to version
 * @param newDocumentation The new documentation content
 * @param userId The ID of the user creating the version
 * @param changesSummary Summary of changes made
 * @returns The ID of the new version
 */
export async function createDocumentationVersion(
  docId: string,
  newDocumentation: Documentation,
  userId: string,
  changesSummary: string = 'Documentation updated'
): Promise<string> {
  try {
    // Generate a version identifier (e.g., v1.0.2, etc.)
    const versionIdentifier = await generateVersionNumber(docId);
    
    // Set previous versions as non-current
    await db
      .update(documentationVersions)
      .set({ is_current: false })
      .where(eq(documentationVersions.doc_id, docId));
    
    // Create new version record
    const versionId = uuidv4();
    await db
      .insert(documentationVersions)
      .values({
        id: versionId,
        doc_id: docId,
        version: versionIdentifier,
        changes_summary: changesSummary,
        is_current: true,
        created_at: new Date(),
        created_by: userId,
      });
    
    // Update documentation with new content
    await db
      .update(documentationRequests)
      .set({
        result: JSON.stringify({ documentation: newDocumentation }),
        updated_at: new Date(),
      })
      .where(eq(documentationRequests.id, docId));
    
    return versionId;
  } catch (error) {
    console.error('Error creating documentation version:', error);
    throw new Error(`Failed to create documentation version: ${(error as Error).message}`);
  }
}

/**
 * Gets all versions of a documentation
 * @param docId The ID of the documentation
 * @returns Array of version information
 */
export async function getDocumentationVersions(docId: string): Promise<{
  id: string;
  version: string;
  changesSummary: string;
  isCurrent: boolean;
  createdAt: Date;
  createdBy: {
    id: string;
    name?: string;
  };
}[]> {
  try {
    const versions = await db.query.documentationVersions.findMany({
      where: eq(documentationVersions.doc_id, docId),
      orderBy: (versions, { desc }) => [desc(versions.created_at)],
      with: {
        user: true,
      },
    });
    
    return versions.map(version => ({
      id: version.id,
      version: version.version,
      changesSummary: version.changes_summary || '',
      isCurrent: version.is_current || false,
      createdAt: version.created_at || new Date(),
      createdBy: {
        id: version.created_by,
        name: version.user?.name || 'Unknown User',
      },
    }));
  } catch (error) {
    console.error('Error getting documentation versions:', error);
    return [];
  }
}

/**
 * Gets a specific version of documentation
 * @param versionId The ID of the version to retrieve
 * @returns The documentation for that version
 */
export async function getDocumentationVersion(versionId: string): Promise<Documentation | null> {
  try {
    const version = await db.query.documentationVersions.findFirst({
      where: eq(documentationVersions.id, versionId),
    });
    
    if (!version || !version.doc_id) {
      return null;
    }
    
    // If this is the current version, get it from the main documentation
    if (version.is_current) {
      const doc = await db.query.documentationRequests.findFirst({
        where: eq(documentationRequests.id, version.doc_id),
      });
      
      if (!doc || !doc.result) {
        return null;
      }
      
      const result = JSON.parse(doc.result.toString());
      return result.documentation || null;
    }
    
    // Otherwise, get it from the version's snapshot
    if (!version.content) {
      return null;
    }
    
    return JSON.parse(version.content.toString()) as Documentation;
  } catch (error) {
    console.error('Error getting documentation version:', error);
    return null;
  }
}

/**
 * Restores a previous version of documentation to be the current version
 * @param versionId The ID of the version to restore
 * @param userId The ID of the user performing the restore
 * @returns Success status
 */
export async function restoreDocumentationVersion(
  versionId: string,
  userId: string
): Promise<boolean> {
  try {
    // Get the version to restore
    const version = await db.query.documentationVersions.findFirst({
      where: eq(documentationVersions.id, versionId),
    });
    
    if (!version || !version.doc_id || !version.content) {
      return false;
    }
    
    // Parse the documentation content
    const documentation = JSON.parse(version.content.toString()) as Documentation;
    
    // Create a new version that is a copy of the old one
    await createDocumentationVersion(
      version.doc_id,
      documentation,
      userId,
      `Restored from version ${version.version}`
    );
    
    return true;
  } catch (error) {
    console.error('Error restoring documentation version:', error);
    return false;
  }
}

/**
 * Generates a new version number based on existing versions
 * @param docId The documentation ID
 * @returns A new version string (e.g., v1.0.2)
 */
async function generateVersionNumber(docId: string): Promise<string> {
  try {
    // Get the latest version
    const latestVersion = await db.query.documentationVersions.findFirst({
      where: eq(documentationVersions.doc_id, docId),
      orderBy: (versions, { desc }) => [desc(versions.created_at)],
    });
    
    if (!latestVersion || !latestVersion.version) {
      // No previous versions, start at v1.0.0
      return 'v1.0.0';
    }
    
    // Parse version string (e.g., v1.0.1)
    const versionString = latestVersion.version;
    const versionMatch = versionString.match(/v(\d+)\.(\d+)\.(\d+)/);
    
    if (!versionMatch) {
      // If version format doesn't match, start fresh
      return 'v1.0.0';
    }
    
    // Increment the patch version
    const major = parseInt(versionMatch[1], 10);
    const minor = parseInt(versionMatch[2], 10);
    let patch = parseInt(versionMatch[3], 10);
    
    patch++;
    
    return `v${major}.${minor}.${patch}`;
  } catch (error) {
    console.error('Error generating version number:', error);
    return `v1.0.0-${Date.now()}`;
  }
} 