import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/supabase/db";
import { Documentation } from "@/lib/ai/types";

// Configure as Edge Function
export const runtime = 'edge';

export async function PUT(request: Request) {
  try {
    // Check if user is authenticated
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { documentationId, documentation } = body;

    if (!documentationId || !documentation) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Verify the documentation request exists and belongs to the user
    const existingDoc = await db
      .select()
      .from("documentation_requests")
      .where({ 
        id: documentationId,
        user_id: session.user.id 
      })
      .first();

    if (!existingDoc) {
      return NextResponse.json(
        { error: "Documentation not found or access denied" },
        { status: 404 }
      );
    }

    // Update the documentation
    await db
      .update({
        result: { documentation },
        updated_at: new Date().toISOString(),
      })
      .from("documentation_requests")
      .where({ id: documentationId });

    // Return success
    return NextResponse.json({
      id: documentationId,
      status: "updated",
      message: "Documentation updated successfully"
    });
  } catch (error) {
    console.error("Documentation update error:", error);
    return NextResponse.json(
      { error: `Failed to update documentation: ${(error as Error).message}` },
      { status: 500 }
    );
  }
} 