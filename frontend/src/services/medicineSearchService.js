import api from '../utils/api';

// Search for medicine information
export const searchMedicine = async (medicineName) => {
  try {
    const response = await api.post('/medicine-search', { medicineName });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to search medicine' };
  }
};

// Compare multiple medicines
export const compareMedicines = async (medicines) => {
  try {
    const response = await api.post('/medicine-search/compare', { medicines });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to compare medicines' };
  }
};

// Check medicine interactions
export const checkInteractions = async (medicines, conditions = []) => {
  try {
    const response = await api.post('/medicine-search/interactions', { medicines, conditions });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to check interactions' };
  }
};

// Get medicine categories
export const getMedicineCategories = async () => {
  try {
    const response = await api.get('/medicine-search/categories');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch categories' };
  }
};

// Fetch verified medicine details from OpenFDA
export const fetchOpenFdaDetails = async (query) => {
  try {
    const response = await api.get('/medicine-search/openfda', { params: { q: query } });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch OpenFDA details' };
  }
};

// Fetch OpenFDA adverse events (top reactions + recent cases)
export const fetchOpenFdaEvents = async (query) => {
  try {
    const response = await api.get('/medicine-search/openfda/events', { params: { q: query } });
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
