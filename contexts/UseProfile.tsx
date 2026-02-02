import { useEffect, useState } from 'react';

interface ProfileData {
  _id?: string;
  role?: string;
  name?: string;
  email?: string;
  image?: string;
  phone?: string;
  streetAddress?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  availability?: boolean;
  loyaltyTier?: string;
  restaurantId?: string;
}

const useProfile = () => {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/profile')
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { data, loading };
};

export default useProfile;
