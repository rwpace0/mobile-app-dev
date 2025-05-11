import getBaseUrl from "./getBaseUrl";

export default async function getExercises() {
  const response = await fetch(`${getBaseUrl()}/exercises`);
  if (!response.ok) {
    throw new Error("Failed to fetch exercise data");
  }

  const responseData = await response.json();
  return responseData.data || responseData;
}
