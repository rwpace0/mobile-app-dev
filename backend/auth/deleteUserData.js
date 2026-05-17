import { supabaseAdmin } from "../database/supabaseClient.js";
import { R2Service } from "../media/r2Service.js";

function throwOnError(error, context) {
  if (error) {
    const err = new Error(`${context}: ${error.message}`);
    err.cause = error;
    throw err;
  }
}

async function deleteR2Keys(keys) {
  for (const urlOrPath of keys) {
    if (!urlOrPath) continue;
    try {
      const { bucket, key } = R2Service.extractBucketAndKey(urlOrPath);
      if (bucket === "default-exercises") continue;
      await R2Service.deleteFile(bucket, key);
    } catch (err) {
      console.error("[deleteUserData] R2 delete failed:", urlOrPath, err.message);
    }
  }
}

async function deleteWorkouts(userId) {
  const { data: workouts, error: workoutsError } = await supabaseAdmin
    .from("workouts")
    .select("workout_id")
    .eq("user_id", userId);

  throwOnError(workoutsError, "Failed to query workouts");

  const workoutIds = (workouts ?? []).map((w) => w.workout_id);
  if (workoutIds.length === 0) return;

  const { data: workoutExercises, error: weError } = await supabaseAdmin
    .from("workout_exercises")
    .select("workout_exercises_id")
    .in("workout_id", workoutIds);

  throwOnError(weError, "Failed to query workout exercises");

  const workoutExercisesIds = (workoutExercises ?? []).map(
    (we) => we.workout_exercises_id,
  );

  if (workoutExercisesIds.length > 0) {
    const { error: setsError } = await supabaseAdmin
      .from("sets")
      .delete()
      .in("workout_exercises_id", workoutExercisesIds);

    throwOnError(setsError, "Failed to delete sets");
  }

  const { error: setsByWorkoutError } = await supabaseAdmin
    .from("sets")
    .delete()
    .in("workout_id", workoutIds);

  throwOnError(setsByWorkoutError, "Failed to delete sets by workout");

  const { error: weDeleteError } = await supabaseAdmin
    .from("workout_exercises")
    .delete()
    .in("workout_id", workoutIds);

  throwOnError(weDeleteError, "Failed to delete workout exercises");

  const { error: workoutsDeleteError } = await supabaseAdmin
    .from("workouts")
    .delete()
    .eq("user_id", userId);

  throwOnError(workoutsDeleteError, "Failed to delete workouts");
}

async function deletePlans(userId) {
  const { data: plans, error: plansError } = await supabaseAdmin
    .from("workout_plans")
    .select("plan_id")
    .eq("user_id", userId);

  throwOnError(plansError, "Failed to query workout plans");

  const planIds = (plans ?? []).map((p) => p.plan_id);
  if (planIds.length > 0) {
    const { error: scheduleError } = await supabaseAdmin
      .from("plan_schedule")
      .delete()
      .in("plan_id", planIds);

    throwOnError(scheduleError, "Failed to delete plan schedule");
  }

  const { error: plansDeleteError } = await supabaseAdmin
    .from("workout_plans")
    .delete()
    .eq("user_id", userId);

  throwOnError(plansDeleteError, "Failed to delete workout plans");
}

async function deleteTemplates(userId) {
  const { data: templates, error: templatesError } = await supabaseAdmin
    .from("workout_templates")
    .select("template_id")
    .eq("created_by", userId);

  throwOnError(templatesError, "Failed to query workout templates");

  const templateIds = (templates ?? []).map((t) => t.template_id);
  if (templateIds.length > 0) {
    const { error: teError } = await supabaseAdmin
      .from("template_exercises")
      .delete()
      .in("template_id", templateIds);

    throwOnError(teError, "Failed to delete template exercises");
  }

  const { error: templatesDeleteError } = await supabaseAdmin
    .from("workout_templates")
    .delete()
    .eq("created_by", userId);

  throwOnError(templatesDeleteError, "Failed to delete workout templates");
}

async function deleteCustomExercise(exercise) {
  const { exercise_id: exerciseId, image_url, video_url } = exercise;
  const mediaKeys = [image_url, video_url].filter(Boolean);

  const { data: workoutExercises, error: weQueryError } = await supabaseAdmin
    .from("workout_exercises")
    .select("workout_exercises_id")
    .eq("exercise_id", exerciseId);

  throwOnError(weQueryError, "Failed to query workout exercises for exercise");

  const workoutExercisesIds = (workoutExercises ?? []).map(
    (we) => we.workout_exercises_id,
  );

  if (workoutExercisesIds.length > 0) {
    const { error: setsError } = await supabaseAdmin
      .from("sets")
      .delete()
      .in("workout_exercises_id", workoutExercisesIds);

    throwOnError(setsError, "Failed to delete sets for exercise");
  }

  const { error: teError } = await supabaseAdmin
    .from("template_exercises")
    .delete()
    .eq("exercise_id", exerciseId);

  throwOnError(teError, "Failed to delete template exercises for exercise");

  const { error: weError } = await supabaseAdmin
    .from("workout_exercises")
    .delete()
    .eq("exercise_id", exerciseId);

  throwOnError(weError, "Failed to delete workout exercises for exercise");

  const { error: exerciseError } = await supabaseAdmin
    .from("exercises")
    .delete()
    .eq("exercise_id", exerciseId);

  throwOnError(exerciseError, "Failed to delete exercise");

  await deleteR2Keys(mediaKeys);
}

async function deleteCustomExercises(userId) {
  const { data: exercises, error: exercisesError } = await supabaseAdmin
    .from("exercises")
    .select("exercise_id, image_url, video_url")
    .eq("created_by", userId)
    .eq("is_public", false);

  throwOnError(exercisesError, "Failed to query custom exercises");

  for (const exercise of exercises ?? []) {
    await deleteCustomExercise(exercise);
  }
}

async function deleteProfile(userId) {
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("avatar_url")
    .eq("user_id", userId)
    .maybeSingle();

  throwOnError(profileError, "Failed to query profile");

  const { error: deleteError } = await supabaseAdmin
    .from("profiles")
    .delete()
    .eq("user_id", userId);

  throwOnError(deleteError, "Failed to delete profile");

  if (profile?.avatar_url) {
    await deleteR2Keys([profile.avatar_url]);
  }
}

export async function deleteAllUserData(userId) {
  await deleteWorkouts(userId);
  await deletePlans(userId);
  await deleteTemplates(userId);
  await deleteCustomExercises(userId);
  await deleteProfile(userId);
  return { success: true };
}
