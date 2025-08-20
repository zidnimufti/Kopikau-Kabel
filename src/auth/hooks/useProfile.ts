import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient'; // Sesuaikan path
import { UserProfile } from '../../types'; // Sesuaikan path
import { useAuth } from './useAuth';

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setLoading(true);
      supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching profile:', error);
          }
          setProfile(data || null);
          setLoading(false);
        });
    } else {
      // Jika tidak ada user, pastikan profil kosong dan loading selesai.
      setProfile(null);
      setLoading(false);
    }
  }, [user]); // Jalankan kembali setiap kali objek 'user' berubah

  return { profile, loadingProfile: loading };
};
