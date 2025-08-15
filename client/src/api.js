import axios from 'axios';

const API_BASE = ''; // Use relative URL for both development and production

export const createApplication = async (appData) => {
  const res = await axios.post(`${API_BASE}/applications`, appData);
  return res.data;
};

export const updateApplicationStatus = async (id, status) => {
  const res = await axios.post(`${API_BASE}/applications/${id}/status`, { status });
  return res.data;
};
