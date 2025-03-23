import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { searchDocumentation, DocSearchParams } from "@/lib/ai/documentation-search";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    // Ensure the user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get search parameters from the request
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("query") || "";
    const repositoryId = searchParams.get("repositoryId") || undefined;
    const userId = searchParams.get("userId") || undefined;
    const tags = searchParams.get("tags") ? searchParams.get("tags")?.split(",") : undefined;
    const componentTypes = searchParams.get("componentTypes") ? searchParams.get("componentTypes")?.split(",") : undefined;
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit") as string) : 10;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset") as string) : 0;
    
    // Create search parameters object
    const searchParamsObj: DocSearchParams = {
      query,
      repositoryId,
      userId,
      tags,
      componentTypes,
      dateFrom,
      dateTo,
      limit,
      offset,
    };
    
    // Search documentation
    const results = await searchDocumentation(searchParamsObj);
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error searching documentation:", error);
    return NextResponse.json(
      { error: `Failed to search documentation: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    // Ensure the user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get search parameters from the request body
    const body = await req.json();
    const searchParamsObj: DocSearchParams = {
      query: body.query || "",
      repositoryId: body.repositoryId,
      userId: body.userId,
      tags: body.tags,
      componentTypes: body.componentTypes,
      dateFrom: body.dateFrom,
      dateTo: body.dateTo,
      limit: body.limit || 10,
      offset: body.offset || 0,
    };
    
    // Search documentation
    const results = await searchDocumentation(searchParamsObj);
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error searching documentation:", error);
    return NextResponse.json(
      { error: `Failed to search documentation: ${(error as Error).message}` },
      { status: 500 }
    );
  }
} 