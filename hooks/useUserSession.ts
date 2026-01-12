import { useEffect } from 'react';
import { useUserStore } from '../app/store/userStore';

export const useUserSession = () => {
  const { subscribeToAuthState, user, profile, isLoading } = useUserStore(
    (state) => ({ 
      subscribeToAuthState: state.subscribeToAuthState,
      user: state.user,
      profile: state.profile,
      isLoading: state.isLoading,
    })
  );

  useEffect(() => {
    const unsubscribe = subscribeToAuthState();
    return () => unsubscribe();
  }, [subscribeToAuthState]);

  return { user, profile, isLoading };
};
