import getBaseUrl from "./getBaseUrl";
import axios from 'axios';
import { storage } from './tokenStorage';

export default async function getExercises() {
  const response = await fetch(`${getBaseUrl()}/exercises`);
  if (!response.ok) {
    throw new Error("Failed to fetch exercise data");
  }

  const responseData = await response.json();
  return responseData;
}

export async function getExerciseById(exerciseId) {
  const response = await fetch(`${getBaseUrl()}/exercises/${exerciseId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch exercise data");
  }

  const responseData = await response.json();
  return responseData;
}

export async function createExercise({ name, equipment, muscle_group }) {
  try {
    const token = await storage.getItem('auth_token');
    if (!token) throw new Error('No auth token found');
    const response = await axios.post(
      `${getBaseUrl()}/exercises/create`,
      { name, equipment, muscle_group },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Create exercise error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
}

export async function getExerciseHistory(exerciseId) {
  try {
    const token = await storage.getItem('auth_token');
    if (!token) throw new Error('No auth token found');
    
    const response = await fetch(`${getBaseUrl()}/exercises/${exerciseId}/history`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error("Failed to fetch exercise history");
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Get exercise history error:', error.response?.data || error.message);
    throw error;
  }
}