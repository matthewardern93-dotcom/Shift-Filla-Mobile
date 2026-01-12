
import { useState, useEffect } from 'react';
import { Job } from '../types';
import { getAllJobs } from '../services/jobs';

export const useAllJobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      try {
        const fetchedJobs = await getAllJobs();
        setJobs(fetchedJobs);
      } catch (err) {
        setError("Failed to fetch jobs. Please try again later.");
        console.error("Error in useAllJobs hook: ", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, []);

  return { jobs, isLoading, error };
};
