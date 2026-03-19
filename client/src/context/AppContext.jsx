"use client";
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const router = useRouter(); 
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (err) {
      console.error("Failed to fetch user:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [router]);

  return (
    <AppContext.Provider value={{ user, setUser, loading, fetchUser }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);