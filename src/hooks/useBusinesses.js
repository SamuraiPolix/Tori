import { useState, useEffect } from 'react';
import FirebaseApi from '../utils/FirebaseApi';

export const useBusinesses = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setLoading(true);
        const fetchedBusinesses = await FirebaseApi.getAllBusinesses();
        setBusinesses(fetchedBusinesses || []);
      } catch (err) {
        console.error('Error fetching businesses:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, []);

  return { businesses, loading, error };
};
