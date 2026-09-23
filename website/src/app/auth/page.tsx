'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const VISITED_KEY = 'olos_has_visited_auth';

export default function AuthRoot() {
  const router = useRouter();

  useEffect(() => {
    const hasVisited = typeof window !== 'undefined' && localStorage.getItem(VISITED_KEY);
    if (hasVisited) {
      router.replace('/auth/signin');
    } else {
      localStorage.setItem(VISITED_KEY, '1');
      router.replace('/auth/splash');
    }
  }, [router]);

  return null;
}
