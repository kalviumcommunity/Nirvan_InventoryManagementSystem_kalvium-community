import { useState, useEffect } from 'react';

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

export const useDashboardData = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch to make it dynamic
    const fetchData = async () => {
      setLoading(true);
      // Simulating network delay to prove it's dynamic
      await new Promise(resolve => setTimeout(resolve, 600));
      
      setData({
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
      });
      setLoading(false);
    };

    fetchData();
  }, []);

  return { data, loading };
};
