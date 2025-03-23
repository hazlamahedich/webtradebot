import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { exportDocumentation } from "@/lib/ai/documentation-generator";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    // Ensure the user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get the documentation ID and format from the request
    const searchParams = req.nextUrl.searchParams;
    const documentationId = searchParams.get("id");
    const format = searchParams.get("format") as "markdown" | "html" | "pdf" | "json";
    
    if (!documentationId) {
      return NextResponse.json(
        { error: "Documentation ID is required" },
        { status: 400 }
      );
    }
    
    if (!format || !["markdown", "html", "pdf", "json"].includes(format)) {
      return NextResponse.json(
        { error: "Valid format is required (markdown, html, pdf, or json)" },
        { status: 400 }
      );
    }
    
    // Export the documentation
    const result = await exportDocumentation(documentationId, format);
    
    // Set up the appropriate content type and filename
    let contentType: string;
    let filename: string;
    
    switch (format) {
      case "markdown":
        contentType = "text/markdown";
        filename = `documentation-${documentationId}.md`;
        break;
      case "html":
        contentType = "text/html";
        filename = `documentation-${documentationId}.html`;
        break;
      case "pdf":
        contentType = "application/pdf";
        filename = `documentation-${documentationId}.pdf`;
        break;
      case "json":
        contentType = "application/json";
        filename = `documentation-${documentationId}.json`;
        break;
      default:
        contentType = "text/plain";
        filename = `documentation-${documentationId}.txt`;
    }
    
    // Create headers for the response
    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    
    // Create and return the response
    return new Response(result, {
      headers,
    });
  } catch (error) {
    console.error("Error exporting documentation:", error);
    return NextResponse.json(
      { error: `Failed to export documentation: ${(error as Error).message}` },
      { status: 500 }
    );
  }
} 