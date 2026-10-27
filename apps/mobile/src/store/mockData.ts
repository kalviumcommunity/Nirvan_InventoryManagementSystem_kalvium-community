import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { auth } from '../config/firebase';

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

export interface DetailedInventoryItem {
  id: string;
  name: string;
  shortName: string;
  category: 'audio' | 'lighting' | 'effects';
  total: number;
  available: number;
  rented: number;
  rate: number;
  icon: string;
  location?: string;
}

export interface RentalOrder {
  id: string;
  displayId: string;
  client: string;
  contact: string;
  phone: string;
  equipName: string;
  units: number;
  startDate: string;
  returnDate: string;
  dueText: string;
  status: 'active' | 'due_today' | 'returned';
}

export interface SettingsData {
  userName: string;
  userRole: string;
  userCompany: string;
  hubName: string;
  gateHours: string;
  overdueAlerts: boolean;
  lowStockWarning: boolean;
}

export interface DashboardData {
  user: User;
  stats: DashboardStats;
  upcomingReturn: UpcomingReturn;
  inventory: InventoryItem[];
  date: string;
}

// In local dev, Expo Web uses localhost, Android emulator uses 10.0.2.2
export const API_URL = process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:8000/api' : 'http://localhost:8000/api');

export const apiFetch = async (path: string, init: RequestInit = {}) => {
  const token = auth ? await auth.currentUser?.getIdToken() : undefined;
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(`${API_URL}${path}`, { ...init, headers });
};

export const DEFAULT_DETAILED_INVENTORY: DetailedInventoryItem[] = [
  {
    id: '1',
    name: 'JBL EON 15" Speakers',
    shortName: 'Speakers',
    category: 'audio',
    total: 20,
    available: 10,
    rented: 10,
    rate: 45,
    icon: 'volume-high',
    location: 'Bay A-12',
  },
  {
    id: '2',
    name: 'Wireless Microphones (Shure)',
    shortName: 'Microphones',
    category: 'audio',
    total: 15,
    available: 12,
    rented: 3,
    rate: 25,
    icon: 'mic',
    location: 'Cabinet C-04',
  },
  {
    id: '3',
    name: 'Stage Lights (RGBW DMX)',
    shortName: 'Stage Lights',
    category: 'lighting',
    total: 30,
    available: 20,
    rented: 10,
    rate: 35,
    icon: 'bulb',
    location: 'Rack L-08',
  },
  {
    id: '4',
    name: 'Fog & FX Machines (Pro)',
    shortName: 'Fog & FX',
    category: 'effects',
    total: 8,
    available: 5,
    rented: 3,
    rate: 60,
    icon: 'fog',
    location: 'Zone E-02',
  },
];

export const DEFAULT_RENTALS_LIST: RentalOrder[] = [
  {
    id: '1',
    displayId: 'RN-8042',
    client: 'Sharma Wedding',
    contact: 'Rahul Sharma',
    phone: '+91 98402 11920',
    equipName: '4x JBL EON 15" Speakers',
    units: 4,
    startDate: '20 Sep, 10:30 AM',
    returnDate: '21 Sep, 06:00 PM',
    dueText: 'Due today 6:00 PM',
    status: 'due_today',
  },
  {
    id: '2',
    displayId: 'RN-8043',
    client: 'ABC Events',
    contact: 'Anita Gupta',
    phone: '+91 98111 22334',
    equipName: '3x Wireless Microphones (Shure)',
    units: 3,
    startDate: '20 Sep, 02:00 PM',
    returnDate: '23 Sep, 11:00 AM',
    dueText: 'Due in 2 days',
    status: 'active',
  },
  {
    id: '3',
    displayId: 'RN-8040',
    client: 'Sunset Music Fest',
    contact: 'Rohan Mehta',
    phone: '+91 98333 44556',
    equipName: '10x Stage Lights (RGBW DMX)',
    units: 10,
    startDate: '19 Sep, 09:00 AM',
    returnDate: '22 Sep, 08:00 PM',
    dueText: 'Due tomorrow',
    status: 'active',
  },
  {
    id: '4',
    displayId: 'RN-8041',
    client: 'Tech Summit 2025',
    contact: 'Priya Nair',
    phone: '+91 98777 66554',
    equipName: '8x Wireless Microphones',
    units: 8,
    startDate: '18 Sep, 08:00 AM',
    returnDate: '20 Sep, 04:00 PM',
    dueText: 'Returned on time',
    status: 'returned',
  },
];

export const DEFAULT_SETTINGS_DATA: SettingsData = {
  userName: 'Sarah Jenkins',
  userRole: 'Warehouse Lead',
  userCompany: 'Apex Event Gear',
  hubName: 'Central Logistics Hub (Bay 4)',
  gateHours: '07:00 AM - 10:00 PM',
  overdueAlerts: true,
  lowStockWarning: true,
};

const DEFAULT_FALLBACK: DashboardData = {
  user: {
    firstName: 'Sarah',
    email: 'name@rentory.supply',
    terminalId: 'Terminal 07',
  },
  stats: {
    total: 73,
    available: 47,
    rented: 26,
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
    { id: '4', name: 'Fog Machines', available: 5, total: 8, icon: 'fog' },
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
