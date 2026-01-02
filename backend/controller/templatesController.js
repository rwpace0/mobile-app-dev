import { supabase } from "../database/supabaseClient.js";
import { getClientToken } from "../database/supabaseClient.js";

export async function createTemplate(req, res) {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No authorization header" });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Get user data from Supabase
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Create authenticated client
    const supabaseWithAuth = getClientToken(token);

    const { template_id, name, is_public, exercises } = req.body;

    // Basic validation
    if (!name || !Array.isArray(exercises) || exercises.length === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if template already exists (for ownership check and preserving created_by)
    const { data: existingTemplate } = await supabaseWithAuth
      .from("workout_templates")
      .select("created_by")
      .eq("template_id", template_id)
      .single();

    // If template exists, verify ownership
    if (existingTemplate && existingTemplate.created_by !== user.id) {
      return res.status(403).json({
        error: "You don't have permission to modify this template",
      });
    }

    // 1. Upsert template (allows retry if creation fails partway through)
    // Note: created_at is preserved automatically by Supabase on update
    const templateToUpsert = {
      template_id,
      name,
      created_by: existingTemplate?.created_by || user.id, // Preserve original creator on update
      is_public: is_public || false,
      updated_at: new Date().toISOString(),
    };

    const { data: templateData, error: templateError } = await supabaseWithAuth
      .from("workout_templates")
      .upsert([templateToUpsert], {
        onConflict: "template_id",
        ignoreDuplicates: false,
      })
      .select();

    if (templateError || !templateData || !templateData[0]) {
      console.error("Template upsert error:", templateError);
      return res.status(500).json({
        error: "Failed to create/update template",
        details: templateError?.message || "Unknown error",
      });
    }

    const template = templateData[0];

    // 2. Delete existing template exercises (in case of retry)
    const { error: deleteExercisesError } = await supabaseWithAuth
      .from("template_exercises")
      .delete()
      .eq("template_id", template.template_id);

    if (deleteExercisesError) {
      console.error("Template exercises delete error:", deleteExercisesError);
      return res.status(500).json({
        error: "Failed to clear existing template exercises",
        details: deleteExercisesError.message,
      });
    }

    // 3. Insert template exercises
    const templateExercisesToInsert = exercises.map((ex) => ({
      template_id: template.template_id,
      exercise_id: ex.exercise_id,
      exercise_order: ex.exercise_order,
      sets: ex.sets || 1, // Add default of 1 if not specified
      weight: ex.weight !== undefined ? ex.weight : null,
      reps: ex.reps !== undefined ? ex.reps : null,
      reps_min: ex.rep_range_min !== undefined ? ex.rep_range_min : null,
      reps_max: ex.rep_range_max !== undefined ? ex.rep_range_max : null,
      rir: ex.rir !== undefined ? ex.rir : null,
      rir_min: ex.rir_range_min !== undefined ? ex.rir_range_min : null,
      rir_max: ex.rir_range_max !== undefined ? ex.rir_range_max : null,
    }));

    const { data: templateExercisesData, error: templateExercisesError } =
      await supabaseWithAuth
        .from("template_exercises")
        .insert(templateExercisesToInsert)
        .select();

    if (templateExercisesError || !templateExercisesData) {
      return res.status(500).json({
        error: "Failed to create template exercises",
        details: templateExercisesError?.message || "Unknown error",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Template created successfully",
      template_id: template.template_id, // Add explicit template_id for frontend sync
      template,
      template_exercises: templateExercisesData,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateTemplate(req, res) {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No authorization header" });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Get user data from Supabase
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Create authenticated client
    const supabaseWithAuth = getClientToken(token);

    const { templateId } = req.params;
    const { name, is_public, exercises } = req.body;

    // Basic validation
    if (!templateId || !name || !Array.isArray(exercises)) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if template exists and belongs to the user
    const { data: existingTemplate, error: templateCheckError } =
      await supabaseWithAuth
        .from("workout_templates")
        .select("template_id, created_by")
        .eq("template_id", templateId)
        .eq("created_by", user.id)
        .single();

    if (templateCheckError || !existingTemplate) {
      return res
        .status(404)
        .json({ error: "Template not found or access denied" });
    }

    // 1. Update the template record
    const { data: updatedTemplate, error: templateUpdateError } =
      await supabaseWithAuth
        .from("workout_templates")
        .update({
          name,
          is_public: is_public || false,
          updated_at: new Date().toISOString(),
        })
        .eq("template_id", templateId)
        .select()
        .single();

    if (templateUpdateError) {
      console.error("Template update error:", templateUpdateError);
      return res.status(500).json({
        error: "Failed to update template",
        details: templateUpdateError.message,
      });
    }

    // 2. Delete existing template exercises
    const { error: deleteExercisesError } = await supabaseWithAuth
      .from("template_exercises")
      .delete()
      .eq("template_id", templateId);

    if (deleteExercisesError) {
      console.error("Template exercises delete error:", deleteExercisesError);
      return res.status(500).json({
        error: "Failed to delete existing template exercises",
        details: deleteExercisesError.message,
      });
    }

    // 3. Insert new template exercises
    let templateExercisesData = [];
    if (exercises.length > 0) {
      const templateExercisesToInsert = exercises.map((ex) => ({
        template_id: templateId,
        exercise_id: ex.exercise_id,
        exercise_order: ex.exercise_order,
        sets: ex.sets || 1,
        weight: ex.weight !== undefined ? ex.weight : null,
        reps: ex.reps !== undefined ? ex.reps : null,
        reps_min: ex.rep_range_min !== undefined ? ex.rep_range_min : null,
        reps_max: ex.rep_range_max !== undefined ? ex.rep_range_max : null,
        rir: ex.rir !== undefined ? ex.rir : null,
        rir_min: ex.rir_range_min !== undefined ? ex.rir_range_min : null,
        rir_max: ex.rir_range_max !== undefined ? ex.rir_range_max : null,
      }));

      const { data: insertedExercises, error: templateExercisesError } =
        await supabaseWithAuth
          .from("template_exercises")
          .insert(templateExercisesToInsert)
          .select();

      if (templateExercisesError) {
        console.error(
          "Template exercises insert error:",
          templateExercisesError
        );
        return res.status(500).json({
          error: "Failed to create template exercises",
          details: templateExercisesError.message,
        });
      }

      templateExercisesData = insertedExercises;
    }

    return res.status(200).json({
      success: true,
      message: "Template updated successfully",
      template: updatedTemplate,
      template_exercises: templateExercisesData,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function getTemplates(req, res) {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No authorization header" });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Get user data from Supabase
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Create authenticated client
    const supabaseWithAuth = getClientToken(token);

    // Query templates with their exercises
    const { data: templates, error: templatesError } = await supabaseWithAuth
      .from("workout_templates")
      .select(
        `
        *,
        template_exercises (
          exercise_id,
          exercise_order,
          sets,
          weight,
          reps,
          reps_min,
          reps_max,
          rir,
          rir_min,
          rir_max,
          exercises (*)
        )
      `
      )
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });

    if (templatesError) {
      console.error("Database query error:", templatesError);
      return res.status(500).json({ error: templatesError.message });
    }

    // Format the response
    const formattedTemplates = templates.map((template) => ({
      ...template,
      exercises: template.template_exercises
        .map((te) => ({
          ...te.exercises,
          exercise_order: te.exercise_order,
          sets: te.sets,
          weight: te.weight,
          reps: te.reps,
          rep_range_min: te.reps_min,
          rep_range_max: te.reps_max,
          rir: te.rir,
          rir_range_min: te.rir_min,
          rir_range_max: te.rir_max,
        }))
        .sort((a, b) => a.exercise_order - b.exercise_order),
    }));

    return res.json(formattedTemplates);
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteTemplate(req, res) {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No authorization header" });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Get user data from Supabase
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Create authenticated client
    const supabaseWithAuth = getClientToken(token);

    const { templateId } = req.params;

    if (!templateId) {
      return res.status(400).json({ error: "Template ID is required" });
    }

    // Check if template exists and belongs to the user
    const { data: template, error: templateCheckError } = await supabaseWithAuth
      .from("workout_templates")
      .select("template_id, created_by")
      .eq("template_id", templateId)
      .single();

    if (templateCheckError || !template) {
      return res.status(404).json({ error: "Template not found" });
    }

    // Verify ownership
    if (template.created_by !== user.id) {
      return res
        .status(403)
        .json({ error: "You don't have permission to delete this template" });
    }

    // Delete template exercises first (due to foreign key constraint)
    const { error: templateExercisesError } = await supabaseWithAuth
      .from("template_exercises")
      .delete()
      .eq("template_id", templateId);

    if (templateExercisesError) {
      console.error("Template exercises delete error:", templateExercisesError);
      return res.status(500).json({
        error: "Failed to delete template exercises",
        details: templateExercisesError.message,
      });
    }

    // Delete the template
    const { error: templateError } = await supabaseWithAuth
      .from("workout_templates")
      .delete()
      .eq("template_id", templateId);

    if (templateError) {
      console.error("Template delete error:", templateError);
      return res.status(500).json({
        error: "Failed to delete template",
        details: templateError.message,
      });
    }

    return res.json({
      success: true,
      message: "Template deleted successfully",
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
