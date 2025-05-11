import { BACKEND_URL } from "@env";

export default async function getExercises() {
  const response = await fetch(`${BACKEND_URL}/exercises`);
  if (!response.ok) {
    throw new Error("Failed to fetch exercise data");
  }

  const responseData = await response.json();
  return responseData.data || responseData;
}
