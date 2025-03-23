import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/supabase/db";
import { llmModels, llmProviders } from "@/lib/supabase/schema";
import { eq } from "drizzle-orm";

// GET endpoint to retrieve all LLM models
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all LLM models with their provider information
    const models = await db
      .select({
        id: llmModels.id,
        name: llmModels.name,
        modelId: llmModels.modelId,
        providerId: llmModels.providerId,
        provider: llmProviders.name,
        maxTokens: llmModels.maxTokens,
        isDefault: llmModels.isDefault,
        tasks: llmModels.tasks,
        createdAt: llmModels.createdAt,
      })
      .from(llmModels)
      .leftJoin(llmProviders, eq(llmModels.providerId, llmProviders.id));
    
    return NextResponse.json({ models });
  } catch (error) {
    console.error("Error fetching LLM models:", error);
    return NextResponse.json(
      { error: "Failed to fetch LLM models" },
      { status: 500 }
    );
  }
}

// POST endpoint to add a new LLM model
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const { name, modelId, providerId, maxTokens, isDefault, tasks } = json;

    if (!name || !modelId || !providerId) {
      return NextResponse.json(
        { error: "Model name, model ID, and provider ID are required" },
        { status: 400 }
      );
    }

    // Verify provider exists
    const provider = await db
      .select()
      .from(llmProviders)
      .where(eq(llmProviders.id, providerId));

    if (provider.length === 0) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    // If setting as default, clear existing defaults for this task
    if (isDefault && tasks && tasks.length > 0) {
      for (const task of tasks) {
        await db
          .update(llmModels)
          .set({ isDefault: false })
          .where(
            eq(llmModels.isDefault, true)
          );
      }
    }

    // Add the new model
    const [newModel] = await db
      .insert(llmModels)
      .values({
        name,
        modelId,
        providerId,
        maxTokens: maxTokens || 4096,
        isDefault: isDefault || false,
        tasks: tasks || ["generation"],
      })
      .returning();

    return NextResponse.json({
      message: "LLM model added successfully",
      model: newModel
    });
  } catch (error) {
    console.error("Error adding LLM model:", error);
    return NextResponse.json(
      { error: "Failed to add LLM model" },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update an existing LLM model
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const { id, name, modelId, providerId, maxTokens, isDefault, tasks } = json;

    if (!id) {
      return NextResponse.json(
        { error: "Model ID is required" },
        { status: 400 }
      );
    }

    // If setting as default, clear existing defaults for relevant tasks
    if (isDefault && tasks && tasks.length > 0) {
      await db
        .update(llmModels)
        .set({ isDefault: false })
        .where(
          eq(llmModels.isDefault, true)
        );
    }

    // Update the model
    const updateValues: any = {};
    if (name !== undefined) updateValues.name = name;
    if (modelId !== undefined) updateValues.modelId = modelId;
    if (providerId !== undefined) updateValues.providerId = providerId;
    if (maxTokens !== undefined) updateValues.maxTokens = maxTokens;
    if (isDefault !== undefined) updateValues.isDefault = isDefault;
    if (tasks !== undefined) updateValues.tasks = tasks;

    const [updatedModel] = await db
      .update(llmModels)
      .set(updateValues)
      .where(eq(llmModels.id, id))
      .returning();

    return NextResponse.json({
      message: "LLM model updated successfully",
      model: updatedModel
    });
  } catch (error) {
    console.error("Error updating LLM model:", error);
    return NextResponse.json(
      { error: "Failed to update LLM model" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove an LLM model
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Model ID is required" },
        { status: 400 }
      );
    }

    // Delete the model
    await db
      .delete(llmModels)
      .where(eq(llmModels.id, parseInt(id)));

    return NextResponse.json({
      message: "LLM model deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting LLM model:", error);
    return NextResponse.json(
      { error: "Failed to delete LLM model" },
      { status: 500 }
    );
  }
} 