import axios from 'axios';
import getBaseUrl from './getBaseUrl';
import { storage } from './tokenStorage';

const createTemplate = async (templateData) => {
  try {
    const token = await storage.getItem('auth_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.post(
      `${getBaseUrl()}/templates/create`,
      templateData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Failed to create template:', error);
    throw error.response?.data || error;
  }
};

const getTemplates = async () => {
  try {
    const token = await storage.getItem('auth_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.get(
      `${getBaseUrl()}/templates`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    throw error.response?.data || error;
  }
};

export const templateAPI = {
  createTemplate,
  getTemplates
}; 