import { supabase, getClientToken } from "../database/supabaseClient.js";

function extractToken(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: "No authorization header" });
    return null;
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "No token provided" });
    return null;
  }
  return token;
}

async function resolveUser(token, res) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: "Invalid or expired token" });
    return null;
  }
  return user;
}

// GET /plans/active
export async function getActivePlan(req, res) {
  try {
    const token = extractToken(req, res);
    if (!token) return;

    const user = await resolveUser(token, res);
    if (!user) return;

    const db = getClientToken(token);

    const { data: plan, error: planError } = await db
      .from("workout_plans")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (planError) {
      console.error("Get active plan error:", planError);
      return res.status(500).json({ error: "Failed to fetch active plan" });
    }

    if (!plan) {
      return res.status(200).json(null);
    }

    // Fetch schedule with template names
    const { data: schedule, error: scheduleError } = await db
      .from("plan_schedule")
      .select("pattern_position, template_id, workout_templates(name)")
      .eq("plan_id", plan.plan_id)
      .order("pattern_position", { ascending: true });

    if (scheduleError) {
      console.error("Get schedule error:", scheduleError);
      return res.status(500).json({ error: "Failed to fetch plan schedule" });
    }

    const normalizedSchedule = (schedule || []).map((entry) => ({
      pattern_position: entry.pattern_position,
      template_id: entry.template_id,
      template_name: entry.workout_templates?.name || null,
    }));

    return res.status(200).json({ ...plan, schedule: normalizedSchedule });
  } catch (err) {
    console.error("Unexpected error in getActivePlan:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// POST /plans
export async function createPlan(req, res) {
  try {
    const token = extractToken(req, res);
    if (!token) return;

    const user = await resolveUser(token, res);
    if (!user) return;

    const db = getClientToken(token);

    const { plan_id: clientPlanId, name, startDate, patternLength, schedule } = req.body;

    if (!name || !startDate || !patternLength) {
      return res.status(400).json({ error: "Missing required fields: name, startDate, patternLength" });
    }

    if (patternLength < 1 || patternLength > 100) {
      return res.status(400).json({ error: "patternLength must be between 1 and 100" });
    }

    // Deactivate any existing active plans for this user
    const { error: deactivateError } = await db
      .from("workout_plans")
      .update({ is_active: false })
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (deactivateError) {
      console.error("Deactivate plans error:", deactivateError);
      return res.status(500).json({ error: "Failed to deactivate existing plans" });
    }

    // Create new plan — honour client-provided plan_id so local and server UUIDs stay in sync
    const planRow = {
      user_id: user.id,
      name,
      is_active: true,
      start_date: startDate,
      pattern_length: patternLength,
    };
    if (clientPlanId) planRow.plan_id = clientPlanId;

    const { data: newPlan, error: createError } = await db
      .from("workout_plans")
      .insert(planRow)
      .select()
      .single();

    if (createError || !newPlan) {
      console.error("Create plan error:", createError);
      return res.status(500).json({ error: "Failed to create plan" });
    }

    // Insert schedule rows
    let normalizedSchedule = [];
    if (Array.isArray(schedule) && schedule.length > 0) {
      const scheduleRows = schedule.map((item) => ({
        plan_id: newPlan.plan_id,
        pattern_position: item.pattern_position,
        template_id: item.template_id || null,
      }));

      const { data: insertedSchedule, error: scheduleError } = await db
        .from("plan_schedule")
        .insert(scheduleRows)
        .select("pattern_position, template_id, workout_templates(name)");

      if (scheduleError) {
        console.error("Insert schedule error:", scheduleError);
        return res.status(500).json({ error: "Plan created but failed to save schedule" });
      }

      normalizedSchedule = (insertedSchedule || []).map((entry) => ({
        pattern_position: entry.pattern_position,
        template_id: entry.template_id,
        template_name: entry.workout_templates?.name || null,
      }));
    }

    return res.status(201).json({ ...newPlan, schedule: normalizedSchedule });
  } catch (err) {
    console.error("Unexpected error in createPlan:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// PUT /plans/:planId
export async function updatePlan(req, res) {
  try {
    const token = extractToken(req, res);
    if (!token) return;

    const user = await resolveUser(token, res);
    if (!user) return;

    const db = getClientToken(token);
    const { planId } = req.params;
    const { name, startDate, patternLength } = req.body;

    if (!name && startDate === undefined && patternLength === undefined) {
      return res.status(400).json({ error: "No fields to update" });
    }

    // Try update first
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (startDate !== undefined) updates.start_date = startDate;
    if (patternLength !== undefined) updates.pattern_length = patternLength;

    const { data: updateRows, error: updateError } = await db
      .from("workout_plans")
      .update(updates)
      .eq("plan_id", planId)
      .eq("user_id", user.id)
      .select();

    if (updateError) {
      console.error("Update plan error:", updateError);
      return res.status(500).json({ error: "Failed to update plan" });
    }

    // Row exists and was updated — return it
    if (updateRows && updateRows.length > 0) {
      return res.status(200).json(updateRows[0]);
    }

    // 0 rows updated — plan doesn't exist on server yet (local-first pending_sync)
    // Use upsert so concurrent syncs don't race into duplicate key errors
    const { data: upsertRows, error: upsertError } = await db
      .from("workout_plans")
      .upsert(
        {
          plan_id: planId,
          user_id: user.id,
          name,
          is_active: true,
          start_date: startDate,
          pattern_length: patternLength,
        },
        { onConflict: "plan_id", ignoreDuplicates: false }
      )
      .select();

    if (upsertError || !upsertRows || upsertRows.length === 0) {
      console.error("Upsert plan error:", upsertError);
      return res.status(500).json({ error: "Failed to upsert plan" });
    }

    return res.status(200).json(upsertRows[0]);
  } catch (err) {
    console.error("Unexpected error in updatePlan:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// PUT /plans/:planId/schedule
// Replaces the entire schedule for a plan
export async function updatePlanSchedule(req, res) {
  try {
    const token = extractToken(req, res);
    if (!token) return;

    const user = await resolveUser(token, res);
    if (!user) return;

    const db = getClientToken(token);
    const { planId } = req.params;
    const { schedule } = req.body;

    if (!Array.isArray(schedule)) {
      return res.status(400).json({ error: "schedule must be an array" });
    }

    // Verify plan belongs to user
    const { data: plan, error: planError } = await db
      .from("workout_plans")
      .select("plan_id")
      .eq("plan_id", planId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (planError || !plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    // Delete existing schedule
    const { error: deleteError } = await db
      .from("plan_schedule")
      .delete()
      .eq("plan_id", planId);

    if (deleteError) {
      console.error("Delete schedule error:", deleteError);
      return res.status(500).json({ error: "Failed to clear existing schedule" });
    }

    if (schedule.length === 0) {
      return res.status(200).json({ schedule: [] });
    }

    // Insert new schedule
    const scheduleRows = schedule.map((item) => ({
      plan_id: planId,
      pattern_position: item.pattern_position,
      template_id: item.template_id || null,
    }));

    const { data: newSchedule, error: insertError } = await db
      .from("plan_schedule")
      .insert(scheduleRows)
      .select("pattern_position, template_id, workout_templates(name)");

    if (insertError) {
      console.error("Insert schedule error:", insertError);
      return res.status(500).json({ error: "Failed to save schedule" });
    }

    const normalizedSchedule = (newSchedule || []).map((entry) => ({
      pattern_position: entry.pattern_position,
      template_id: entry.template_id,
      template_name: entry.workout_templates?.name || null,
    }));

    return res.status(200).json({ schedule: normalizedSchedule });
  } catch (err) {
    console.error("Unexpected error in updatePlanSchedule:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// DELETE /plans/:planId
export async function deletePlan(req, res) {
  try {
    const token = extractToken(req, res);
    if (!token) return;

    const user = await resolveUser(token, res);
    if (!user) return;

    const db = getClientToken(token);
    const { planId } = req.params;

    // Verify plan belongs to user
    const { data: plan, error: planError } = await db
      .from("workout_plans")
      .select("plan_id")
      .eq("plan_id", planId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (planError || !plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    // Delete schedule first (FK constraint)
    const { error: scheduleDeleteError } = await db
      .from("plan_schedule")
      .delete()
      .eq("plan_id", planId);

    if (scheduleDeleteError) {
      console.error("Delete schedule error:", scheduleDeleteError);
      return res.status(500).json({ error: "Failed to delete plan schedule" });
    }

    // Delete plan
    const { error: planDeleteError } = await db
      .from("workout_plans")
      .delete()
      .eq("plan_id", planId);

    if (planDeleteError) {
      console.error("Delete plan error:", planDeleteError);
      return res.status(500).json({ error: "Failed to delete plan" });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Unexpected error in deletePlan:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
