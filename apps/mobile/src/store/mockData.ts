import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

export interface User {
  firstName: string;
  email: string;
  terminalId: string;
}

export interface DashboardStats {
  total: number;
  available: number;
  rented: number;
}

export interface UpcomingReturn {
  id: string;
  title: string;
  details: string;
  dueTime: string;
  status: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  available: number;
  total: number;
  icon: string;
}

export interface DashboardData {
  user: User;
  stats: DashboardStats;
  upcomingReturn: UpcomingReturn;
  inventory: InventoryItem[];
  date: string;
}

// In local dev, Expo Web uses localhost, Android emulator uses 10.0.2.2
export const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000/api' : 'http://localhost:8000/api';

const DEFAULT_FALLBACK: DashboardData = {
  user: {
    firstName: 'Sarah',
    email: 'name@rentory.supply',
    terminalId: 'Terminal 07',
  },
  stats: {
    total: 65,
    available: 42,
    rented: 23,
  },
  upcomingReturn: {
    id: '1',
    title: 'Sharma Wedding',
    details: '4 Speakers',
    dueTime: 'Due 6:00 PM today',
    status: '1 Due Today',
  },
  inventory: [
    { id: '1', name: 'Speakers', available: 10, total: 20, icon: 'volume-high' },
    { id: '2', name: 'Microphones', available: 12, total: 15, icon: 'mic' },
    { id: '3', name: 'Stage Lights', available: 20, total: 30, icon: 'bulb' },
  ],
  date: 'Monday, 20 Sep',
};

export const useDashboardData = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`${API_URL}/dashboard`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const liveData = await res.json();
        setData({
          user: liveData.user || DEFAULT_FALLBACK.user,
          stats: liveData.stats || DEFAULT_FALLBACK.stats,
          upcomingReturn: liveData.upcomingReturn || DEFAULT_FALLBACK.upcomingReturn,
          inventory: (liveData.inventory || []).map((it: any) => ({
            id: String(it.id),
            name: it.name,
            available: it.available,
            total: it.total,
            icon: it.icon && it.icon.includes('mic') ? 'mic' : it.icon && it.icon.includes('light') ? 'bulb' : 'volume-high'
          })),
          date: liveData.date || DEFAULT_FALLBACK.date
        });
      } else {
        setData(DEFAULT_FALLBACK);
      }
    } catch (err) {
      // Graceful fallback to maintain offline stability
      console.log('Mobile using local fallback store:', err);
      setData(DEFAULT_FALLBACK);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, refetch: fetchData };
};
