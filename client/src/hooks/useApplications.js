import { useState, useEffect, useCallback } from 'react';
import {
  createApplication,
  getApplications,
  getArchivedApplications,
} from '../api';

export const useApplications = () => {
  const [applications, setApplications] = useState([]);
  const [archivedApplications, setArchivedApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [activeRes, archivedRes] = await Promise.all([
        getApplications(),
        getArchivedApplications(),
      ]);

      setApplications(activeRes);
      setArchivedApplications(archivedRes);
    } catch (err) {
      setError(err.message || 'Failed to fetch applications');
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addApplication = useCallback(
    async applicationData => {
      try {
        setError(null);
        const newApplication = await createApplication(applicationData);
        await fetchApplications(); // Refresh the list
        return newApplication;
      } catch (err) {
        setError(err.message || 'Failed to create application');
        throw err;
      }
    },
    [fetchApplications]
  );

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  return {
    applications,
    archivedApplications,
    loading,
    error,
    fetchApplications,
    addApplication,
  };
};
