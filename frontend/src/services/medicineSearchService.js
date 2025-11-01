import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get auth token
const getAuthToken = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.token;
};

// Search for medicine information
export const searchMedicine = async (medicineName) => {
  try {
    const response = await axios.post(
      `${API_URL}/medicine-search`,
      { medicineName },
      {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to search medicine' };
  }
};

// Compare multiple medicines
export const compareMedicines = async (medicines) => {
  try {
    const response = await axios.post(
      `${API_URL}/medicine-search/compare`,
      { medicines },
      {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to compare medicines' };
  }
};

// Check medicine interactions
export const checkInteractions = async (medicines, conditions = []) => {
  try {
    const response = await axios.post(
      `${API_URL}/medicine-search/interactions`,
      { medicines, conditions },
      {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to check interactions' };
  }
};

// Get medicine categories
export const getMedicineCategories = async () => {
  try {
    const response = await axios.get(`${API_URL}/medicine-search/categories`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch categories' };
  }
};

// Fetch verified medicine details from OpenFDA
export const fetchOpenFdaDetails = async (query) => {
  try {
    const response = await axios.get(`${API_URL}/medicine-search/openfda`, {
      params: { q: query }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch OpenFDA details' };
  }
};

// Fetch OpenFDA adverse events (top reactions + recent cases)
export const fetchOpenFdaEvents = async (query) => {
  try {
    const response = await axios.get(`${API_URL}/medicine-search/openfda/events`, {
      params: { q: query }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch OpenFDA events' };
  }
};

export default {
  searchMedicine,
  compareMedicines,
  checkInteractions,
  getMedicineCategories,
  fetchOpenFdaDetails,
  fetchOpenFdaEvents,
};
