import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get auth token
const getAuthToken = () => {
  const token = localStorage.getItem('token');
  return token ? `Bearer ${token}` : '';
};

// Upload and analyze report
export const uploadReport = async (file, reportName = '', reportType = '') => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Please login to upload reports');
    }

    const formData = new FormData();
    formData.append('report', file);
    if (reportName) formData.append('reportName', reportName);
    if (reportType) formData.append('reportType', reportType);

    console.log('Uploading report to:', `${API_URL}/ai/analyze-report`);
    console.log('File:', file.name, file.type, file.size);

    const response = await axios.post(`${API_URL}/ai/analyze-report`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: token,
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        console.log('Upload progress:', percentCompleted);
      },
      timeout: 180000, // 3 minutes for AI analysis
    });

    console.log('Upload successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error uploading report:', error);
    console.error('Error response:', error.response?.data);
    
    // Return structured error
    if (error.response?.data) {
      throw error.response.data;
    }
    
    throw { 
      success: false, 
      message: error.message || 'Failed to upload report' 
    };
  }
};

// Get all reports for user
export const getUserReports = async () => {
  try {
    const response = await axios.get(`${API_URL}/reports`, {
      headers: {
        Authorization: getAuthToken(),
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw error.response?.data || { success: false, message: 'Failed to fetch reports' };
  }
};

// Get single report by ID
export const getReportById = async (reportId) => {
  try {
    const response = await axios.get(`${API_URL}/reports/${reportId}`, {
      headers: {
        Authorization: getAuthToken(),
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching report:', error);
    throw error.response?.data || { success: false, message: 'Failed to fetch report' };
  }
};

// Compare multiple reports
export const compareReports = async (reportIds) => {
  try {
    const response = await axios.post(
      `${API_URL}/ai/compare-reports`,
      { report_ids: reportIds },
      {
        headers: {
          Authorization: getAuthToken(),
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error comparing reports:', error);
    throw error.response?.data || { success: false, message: 'Failed to compare reports' };
  }
};

// Delete report
export const deleteReport = async (reportId) => {
  try {
    const response = await axios.delete(`${API_URL}/reports/${reportId}`, {
      headers: {
        Authorization: getAuthToken(),
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error deleting report:', error);
    throw error.response?.data || { success: false, message: 'Failed to delete report' };
  }
};

// Download report file
export const downloadReport = async (reportId) => {
  try {
    const response = await axios.get(`${API_URL}/reports/${reportId}/download`, {
      headers: { Authorization: getAuthToken() },
      responseType: 'blob',
    });

    // Extract filename from headers if present
    const disposition = response.headers['content-disposition'] || '';
    let filename = 'report';
    const match = disposition.match(/filename="?([^";]+)"?/i);
    if (match && match[1]) filename = match[1];

    // Create a download link
    const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);

    return { success: true };
  } catch (error) {
    console.error('Error downloading report:', error);
    throw error.response?.data || { success: false, message: 'Failed to download report' };
  }
};

// Get WHO guidelines
export const getWHOGuidelines = async (topic) => {
  try {
    const response = await axios.get(`${API_URL}/ai/who-guidelines/${topic}`, {
      headers: {
        Authorization: getAuthToken(),
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching WHO guidelines:', error);
    throw error.response?.data || { success: false, message: 'Failed to fetch WHO guidelines' };
  }
};
