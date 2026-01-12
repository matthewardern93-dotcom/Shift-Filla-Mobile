
import { useState, useEffect } from 'react';
import { PermanentJob } from '../types';
import { getPermanentJobs } from '../services/jobs';

interface UsePermanentJobsFilters {
  venueId?: string;
  status?: string;
}

export const usePermanentJobs = (filters: UsePermanentJobsFilters) => {
  const [jobs, setJobs] = useState<PermanentJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedJobs = await getPermanentJobs(filters);
        setJobs(fetchedJobs);
      } catch (err) {
        setError(err as Error);
        console.error("Error in usePermanentJobs hook: ", err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [filters.venueId, filters.status]); // Effect dependencies

  return { jobs, loading, error };
};
