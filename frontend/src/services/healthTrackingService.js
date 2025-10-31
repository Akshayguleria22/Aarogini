import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get auth token
const getAuthToken = () => {
  const token = localStorage.getItem('token');
  return token ? `Bearer ${token}` : '';
};

// Get comprehensive health dashboard
export const getHealthDashboard = async () => {
  try {
    const response = await axios.get(`${API_URL}/health-tracking/dashboard`, {
      headers: {
        Authorization: getAuthToken(),
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching health dashboard:', error);
    throw error.response?.data || { success: false, message: 'Failed to fetch health dashboard' };
  }
};

// Get detailed info for a specific condition
export const getConditionDetails = async (conditionName) => {
  try {
    const response = await axios.get(
      `${API_URL}/health-tracking/condition/${encodeURIComponent(conditionName)}`,
      {
        headers: {
          Authorization: getAuthToken(),
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching condition details:', error);
    throw error.response?.data || { success: false, message: 'Failed to fetch condition details' };
  }
};

// Get health trends over time
export const getHealthTrends = async () => {
  try {
    const response = await axios.get(`${API_URL}/health-tracking/trends`, {
      headers: {
        Authorization: getAuthToken(),
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching health trends:', error);
    throw error.response?.data || { success: false, message: 'Failed to fetch health trends' };
  }
};

export default {
  getHealthDashboard,
  getConditionDetails,
  getHealthTrends,
};
