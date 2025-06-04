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

    const { name, is_public, exercises } = req.body;

    // Basic validation
    if (!name || !Array.isArray(exercises) || exercises.length === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 1. Insert template
    const { data: templateData, error: templateError } = await supabaseWithAuth
      .from("workout_templates")
      .insert([
        {
          name,
          created_by: user.id,
          is_public: is_public || false,
        },
      ])
      .select();

    if (templateError || !templateData || !templateData[0]) {
      console.error("Template insert error:", templateError);
      return res.status(500).json({
        error: "Failed to create template",
        details: templateError?.message || "Unknown error",
      });
    }

    const template = templateData[0];

    // 2. Insert template exercises
    const templateExercisesToInsert = exercises.map((ex) => ({
      template_id: template.template_id,
      exercise_id: ex.exercise_id,
      exercise_order: ex.exercise_order,
      sets: ex.sets || 1, // Add default of 1 if not specified
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
      template,
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
      .select(`
        *,
        template_exercises (
          exercise_id,
          exercise_order,
          sets,
          exercises (*)
        )
      `)
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });

    if (templatesError) {
      console.error("Database query error:", templatesError);
      return res.status(500).json({ error: templatesError.message });
    }

    // Format the response
    const formattedTemplates = templates.map(template => ({
      ...template,
      exercises: template.template_exercises.map(te => ({
        ...te.exercises,
        exercise_order: te.exercise_order,
        sets: te.sets
      })).sort((a, b) => a.exercise_order - b.exercise_order)
    }));

    return res.json(formattedTemplates);
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
