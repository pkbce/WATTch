'use client';

import { useState, useEffect, useRef } from 'react';
import { Lightbulb, Refrigerator, Wind, Plug } from 'lucide-react';
import { LoadCard } from '@/components/load-card';
import { useNotifications } from '@/hooks/use-notifications';
import { useRealtimeDatabase } from '@/components/FirebaseContext';
import { useLaravelAuth } from '@/components/LaravelAuthContext';
import { API_BASE_URL } from '@/lib/config';

export interface DataPoint {
  time: string;
  consumption: number;
}

export interface Socket {
  id: string;
  name: string;
  data: DataPoint[];
  isPoweredOn: boolean;
  currentPower: number;
  lastUpdated: number;
  isOnline: boolean;
}

const loadInfo = {
  light: {
    title: 'Light Load',
    appliances: [
      'LED bulbs',
      'Lamps',
      'Phone chargers',
      'Laptops',
      'Small fans',
      'Wi-Fi routers',
    ],
  },
  medium: {
    title: 'Medium Load',
    appliances: [
      'Refrigerators',
      'Televisions',
      'Desktop computers',
      'Washing machines (on light cycles)',
      'Microwaves',
      'Coffee makers',
    ],
  },
  heavy: {
    title: 'Heavy Load',
    appliances: [
      'Air conditioners',
      'Electric water heaters',
      'Electric stoves and ovens',
      'Washing machines (on heavy cycles)',
      'Dryers',
      'Dishwashers',
    ],
  },
  universal: {
    title: 'Universal Load',
    appliances: [
      'This load supports a mix of appliance types.',
      'It is designed for general purpose circuits.',
      'Can handle devices from light, medium, and some heavy loads, but check your circuit breaker\'s capacity.',
    ],
  },
  // Add Total Usage info if needed, but not used in cards
};

type LoadType = 'light' | 'medium' | 'heavy' | 'universal';

// Helper function to generate next available socket ID
const generateNextSocketId = (loadType: LoadType, existingSockets: Socket[]): string | null => {
  const baseESP = loadType === 'light' ? 'ESP1' :
    loadType === 'medium' ? 'ESP2' :
      loadType === 'heavy' ? 'ESP3' : 'ESP4';

  // Maximum 10 sockets per type (base + _1 through _9)
  const maxSockets = 10;
  if (existingSockets.length >= maxSockets) {
    return null; // Limit reached
  }

  // Get all existing IDs for this load type
  const existingIds = new Set(existingSockets.map(s => s.id));

  // Check if base ID is available
  if (!existingIds.has(baseESP)) {
    return baseESP;
  }

  // Check for available sub-IDs (_1 through _9)
  for (let i = 1; i <= 9; i++) {
    const id = `${baseESP}_${i}`;
    if (!existingIds.has(id)) {
      return id;
    }
  }

  return null; // All slots taken
};

// Helper function to get base ESP ID from socket ID
const getBaseEspId = (socketId: string): string => {
  // ESP1_1 -> ESP1, ESP2_3 -> ESP2, etc.
  return socketId.split('_')[0];
};

export function DashboardClient() {
  const { user, token } = useLaravelAuth();
  const { data, updateRelay, setPower, addDevice, removeDevice } = useRealtimeDatabase();
  const [sockets, setSockets] = useState<Record<LoadType, Socket[]>>({
    light: [],
    medium: [],
    heavy: [],
    universal: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [socketsLoaded, setSocketsLoaded] = useState(false);

  // Ref to track the last real reading from Firebase to handle deduplication
  const lastReadings = useRef<{ [key: string]: number | null }>({
    ESP1: null,
    ESP2: null,
    ESP3: null,
    ESP4: null,
  });
  const hasInitialSync = useRef(false);
  // Ref to access latest data in fetchSockets without adding it to dependency array
  const dataRef = useRef(data);

  // Update dataRef whenever data changes
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const { permission, requestPermission, showNotification } = useNotifications();

  // Fetch sockets from Laravel on load
  useEffect(() => {
    if (!user || !token) return;

    const fetchSockets = async () => {
      try {
        const [ll, ml, hl, ul] = await Promise.all([
          fetch(`${API_BASE_URL}/ll_db_route`, { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.json()),
          fetch(`${API_BASE_URL}/ml_db_route`, { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.json()),
          fetch(`${API_BASE_URL}/hl_db_route`, { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.json()),
          fetch(`${API_BASE_URL}/ul_db_route`, { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.json()),
        ]);

        // Map Laravel data to Socket interface
        // Assuming Laravel returns array of objects with socket_id, socket_name, power_status, etc.
        // We need to initialize 'data' array and 'currentPower'

        const mapToSocket = (dbSockets: any[], loadType: LoadType): Socket[] => {
          return dbSockets.map((s: any) => {
            // Get initial state from Firebase data using socket's own ID
            let initialRelay = s.power_status === 1; // Default to DB
            let initialPower = 0;

            const currentData = dataRef.current;
            // Read from socket's own Firebase path (ESP1_1, ESP1_2, etc.)
            if (currentData && currentData[s.socket_id]) {
              initialRelay = currentData[s.socket_id].relay;
              initialPower = currentData[s.socket_id].power;
              // Initialize tracking for this socket ID
              if (!lastReadings.current[s.socket_id]) {
                lastReadings.current[s.socket_id] = initialPower;
              }
            }

            return {
              id: s.socket_id,
              name: s.socket_name,
              data: initialPower > 0 ? [{
                time: new Date().toLocaleTimeString(),
                consumption: initialPower
              }] : [],
              isPoweredOn: initialRelay,
              currentPower: initialPower,
              // Store other DB fields if needed for consumption tracking
              eu_daily: s.eu_daily,
              ec_daily: s.ec_daily,
              eu_monthly: s.eu_monthly,
              ec_monthly: s.ec_monthly,
              lastUpdated: Date.now(),
              isOnline: true, // Assume online initially
            };
          });
        };

        setSockets({
          light: mapToSocket(ll, 'light'),
          medium: mapToSocket(ml, 'medium'),
          heavy: mapToSocket(hl, 'heavy'),
          universal: mapToSocket(ul, 'universal'),
        });
        // Use setTimeout to ensure this update happens in a subsequent tick/render cycle
        // to avoid race conditions with the Firebase effect
        setTimeout(() => setSocketsLoaded(true), 0);
        setIsLoading(false);

      } catch (error) {
        console.error("Failed to fetch sockets from Laravel", error);
      }
    };

    fetchSockets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  // Reset power values to 0 on component mount (Firebase) for all sockets
  useEffect(() => {
    const resetPowerValues = async () => {
      // Wait for sockets to be loaded first
      if (!socketsLoaded) return;

      // Get all socket IDs across all load types
      const allSocketIds: string[] = [];
      (['light', 'medium', 'heavy', 'universal'] as LoadType[]).forEach(loadType => {
        sockets[loadType].forEach(socket => {
          allSocketIds.push(socket.id);
        });
      });

      // Reset power for each socket in Firebase
      for (const socketId of allSocketIds) {
        await setPower(socketId, 0);
      }
    };

    resetPowerValues();
  }, [socketsLoaded]); // Only run when sockets are loaded

  useEffect(() => {
    if (permission === 'default') {
      requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    // Notification logic (simplified for brevity)
  }, [sockets, permission, showNotification]);


  const addSocket = async (loadType: LoadType, name: string) => {
    if (!user) return;

    // Generate next available ID
    const socketId = generateNextSocketId(loadType, sockets[loadType]);
    if (!socketId) {
      alert(`Maximum socket limit reached for ${loadType} load (10 sockets max)`);
      return;
    }

    const endpoint = loadType === 'light' ? 'll_add_socket' :
      loadType === 'medium' ? 'ml_add_socket' :
        loadType === 'heavy' ? 'hl_add_socket' : 'ul_add_socket';

    try {
      // Add to Firebase
      await addDevice(socketId);

      // Add to Laravel backend
      await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ socket_id: socketId, socket_name: name }),
      });

      // Update local state
      setSockets(prev => ({
        ...prev,
        [loadType]: [...prev[loadType], {
          id: socketId,
          name,
          data: [],
          isPoweredOn: false,
          currentPower: 0,
          lastUpdated: Date.now(),
          isOnline: false
        }]
      }));
    } catch (e) {
      console.error("Add socket failed", e);
      // Rollback Firebase if backend fails
      await removeDevice(socketId);
    }
  }

  const removeSocket = async (socketId: string) => {
    if (!user) return;
    // Need to find load type first
    let loadType: LoadType | null = null;
    for (const type of ['light', 'medium', 'heavy', 'universal'] as LoadType[]) {
      if (sockets[type].find(s => s.id === socketId)) {
        loadType = type;
        break;
      }
    }
    if (!loadType) return;

    const endpoint = loadType === 'light' ? 'll_delete_row' :
      loadType === 'medium' ? 'ml_delete_row' :
        loadType === 'heavy' ? 'hl_delete_row' : 'ul_delete_row';

    try {
      // Remove from Firebase
      await removeDevice(socketId);

      // Remove from Laravel backend
      await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ socket_id: socketId }),
      });

      // Update local state
      setSockets(prev => ({
        ...prev,
        [loadType!]: prev[loadType!].filter(s => s.id !== socketId)
      }));
    } catch (e) {
      console.error("Remove socket failed", e);
      // Rollback Firebase if backend fails
      await addDevice(socketId);
    }
  }

  const toggleSocketPower = async (socketId: string) => {
    if (!user) return;
    const socket = Object.values(sockets).flat().find(s => s.id === socketId);
    if (!socket) return;

    const newStatus = !socket.isPoweredOn;

    // Find which load type this socket belongs to
    let loadType: LoadType | null = null;
    for (const type of ['light', 'medium', 'heavy', 'universal'] as LoadType[]) {
      if (sockets[type].find(s => s.id === socketId)) {
        loadType = type;
        break;
      }
    }

    if (!loadType) return;

    // Update Firebase relay for this specific socket ID
    updateRelay(socketId, newStatus);

    // 2. Update Laravel database for this specific socket
    const endpoint = loadType === 'light' ? 'll_change_power_status' :
      loadType === 'medium' ? 'ml_change_power_status' :
        loadType === 'heavy' ? 'hl_change_power_status' : 'ul_change_power_status';

    await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ socket_id: socketId, power_status: newStatus ? 1 : 0 }),
    });
  }

  const updateSocketName = async (socketId: string, newName: string) => {
    if (!user) return;
    let loadType: LoadType | null = null;
    for (const type of ['light', 'medium', 'heavy', 'universal'] as LoadType[]) {
      if (sockets[type].find(s => s.id === socketId)) {
        loadType = type;
        break;
      }
    }
    if (!loadType) return;

    const endpoint = loadType === 'light' ? 'll_change_socket_name' :
      loadType === 'medium' ? 'ml_change_socket_name' :
        loadType === 'heavy' ? 'hl_change_socket_name' : 'ul_change_socket_name';

    await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ socket_id: socketId, socket_name: newName }),
    });

    setSockets(prevSockets => {
      const newSockets = { ...prevSockets };
      newSockets[loadType!] = newSockets[loadType!].map(socket => {
        if (socket.id === socketId) {
          return { ...socket, name: newName };
        }
        return socket;
      });
      return newSockets;
    });
  };

  const resetConsumption = async (socketId: string) => {
    if (!user) return;
    let loadType: LoadType | null = null;
    for (const type of ['light', 'medium', 'heavy', 'universal'] as LoadType[]) {
      if (sockets[type].find(s => s.id === socketId)) {
        loadType = type;
        break;
      }
    }
    if (!loadType) return;

    const endpoint = loadType === 'light' ? 'll_reset_consumption' :
      loadType === 'medium' ? 'ml_reset_consumption' :
        loadType === 'heavy' ? 'hl_reset_consumption' : 'ul_reset_consumption';

    try {
      await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ socket_id: socketId }),
      });
      // Update local state to 0
      setSockets(prevSockets => {
        const newSockets = { ...prevSockets };
        newSockets[loadType!] = newSockets[loadType!].map(socket => {
          if (socket.id === socketId) {
            return { ...socket, eu_daily: 0, ec_daily: 0, eu_monthly: 0, ec_monthly: 0 };
          }
          return socket;
        });
        return newSockets;
      });
    } catch (e) {
      console.error("Reset consumption failed", e);
    }
  }

  // Update consumption in Laravel periodically or when data changes
  // For simplicity, we'll just update when we receive new data from Firebase that is added to history
  // But we need to accumulate it.
  // Actually, the requirement says "store data in the database from firebase".
  // If we just send the current power, it's not "consumption" (kWh).
  // But the table has `eu_daily` (Energy Usage).
  // I will assume for now we are just storing the *latest* power reading or accumulating it?
  // Given the columns `eu_daily`, `ec_daily` (Energy Cost?), it implies accumulation.
  // I will implement a simple accumulation: new_consumption = old_consumption + (power * time_diff).
  // But for this task, I'll just send the *current power* as a placeholder for "usage" if that's what the user implies, 
  // OR I will just leave the update function available and maybe call it with the current power value?
  // The user said "store data in the database from firebase".
  // I'll update the `eu_daily` with the *current power* for now, as calculating true kWh requires precise timing.
  // Or better, I'll just not auto-update it yet unless I'm sure.
  // Wait, "reset of consumption" implies it IS accumulating.
  // I will skip auto-update for now to avoid corrupting data with wrong calculations, unless I see a clear way.
  // Actually, I'll add a `saveConsumption` function that `LoadCard` can call, or just call it when data updates.
  // Let's just call it when data updates.

  useEffect(() => {
    if (data && socketsLoaded) {
      console.log('🔥 Firebase data updated:', data);
      setIsLoading(false);
      setSockets(prevSockets => {
        // Guard against empty sockets (race condition safety)
        if (prevSockets.light.length === 0 && prevSockets.medium.length === 0 &&
          prevSockets.heavy.length === 0 && prevSockets.universal.length === 0) {
          return prevSockets;
        }

        const newSockets = { ...prevSockets };

        const updateSocketData = (socket: Socket, loadType: LoadType) => {
          // Read from socket's own Firebase path (ESP1_1, ESP1_2, etc.)
          const espData = data[socket.id];
          if (!espData) return null;

          const incomingPower = espData.power;
          const isPoweredOn = espData.relay;
          console.log(`📊 Socket ${socket.id} - Power: ${incomingPower}W, Relay: ${isPoweredOn}`);

          // Helper to update consumption via proper sync endpoint
          // Helper to update consumption via proper sync endpoint
          const updateConsumption = (socketId: string, power: number) => {
            // Sync is now handled by the background service (jwt/firebase-sync/sync-service.js)
            // We do NOT sync from frontend to avoid double counting and ensure background updates
            if (!user) return;
            // console.log('Frontend sync skipped for', socketId);
          };

          // Check if this is the first load for this socket or first sync
          if (lastReadings.current[socket.id] === null || !hasInitialSync.current) {
            lastReadings.current[socket.id] = incomingPower;

            // Send initial consumption update
            updateConsumption(socket.id, incomingPower);

            return {
              ...socket,
              isPoweredOn,
              currentPower: incomingPower,
              lastUpdated: Date.now(),
              isOnline: true,
              data: incomingPower > 0 ? [{
                time: new Date().toLocaleTimeString(),
                consumption: incomingPower
              }] : [],
            };
          }

          // Check for changes
          const previousRealPower = lastReadings.current[socket.id] || 0;
          const powerChanged = incomingPower !== previousRealPower;
          const relayChanged = isPoweredOn !== socket.isPoweredOn;
          const hasChanged = powerChanged || relayChanged;

          if (hasChanged) {
            lastReadings.current[socket.id] = incomingPower;
          }

          let newData = socket.data;
          const isDuplicate = socket.data.length > 0 && socket.data[socket.data.length - 1].consumption === incomingPower;
          if (!isDuplicate) {
            const newDataPoint = {
              time: new Date().toLocaleTimeString(),
              consumption: incomingPower
            };
            newData = [...socket.data, newDataPoint];
            if (newData.length > 15) {
              newData = newData.slice(newData.length - 15);
            }
          }

          if (powerChanged) {
            updateConsumption(socket.id, incomingPower);
          }

          return {
            ...socket,
            isPoweredOn,
            currentPower: incomingPower,
            lastUpdated: Date.now(),
            isOnline: true,
            data: newData
          };
        };

        // Update all sockets across all load types
        (['light', 'medium', 'heavy', 'universal'] as LoadType[]).forEach(loadType => {
          newSockets[loadType] = newSockets[loadType].map(socket => {
            const updated = updateSocketData(socket, loadType);
            return updated || socket; // Return updated socket or original if no Firebase data
          });
        });

        hasInitialSync.current = true;
        return newSockets;
      });
    }
  }, [data, user, socketsLoaded]);

  // Timeout check effect - only updates status, not chart data
  useEffect(() => {
    const interval = setInterval(() => {
      setSockets(prevSockets => {
        const now = Date.now();
        const newSockets = { ...prevSockets };
        let hasChanges = false;

        (['light', 'medium', 'heavy', 'universal'] as LoadType[]).forEach(type => {
          newSockets[type] = newSockets[type].map(socket => {
            // Check if socket has timed out (3 seconds of no new data)
            const isOnline = now - socket.lastUpdated < 3000;

            // Check if status changed
            if (socket.isOnline !== isOnline) {
              hasChanges = true;
            }

            return {
              ...socket,
              isOnline
              // Chart data (socket.data) is NOT modified here
            };
          });
        });

        return hasChanges ? newSockets : prevSockets;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <LoadCard
        title="Light Load"
        icon={<Lightbulb className="w-6 h-6" />}
        sockets={sockets.light}
        chartColor="hsl(120 100% 35%)"
        loadInfo={loadInfo.light}
        onTogglePower={toggleSocketPower}
        onAddSocket={(name) => addSocket('light', name)}
        onUpdateSocketName={updateSocketName}
        onRemoveSocket={removeSocket}
        idPrefix="ESP"
        isLoading={isLoading}
      />
      <LoadCard
        title="Medium Load"
        icon={<Refrigerator className="w-6 h-6" />}
        sockets={sockets.medium}
        chartColor="#F1C40F"
        loadInfo={loadInfo.medium}
        onTogglePower={toggleSocketPower}
        onAddSocket={(name) => addSocket('medium', name)}
        onUpdateSocketName={updateSocketName}
        onRemoveSocket={removeSocket}
        idPrefix="ESP"
        isLoading={isLoading}
      />
      <LoadCard
        title="Heavy Load"
        icon={<Wind className="w-6 h-6" />}
        sockets={sockets.heavy}
        chartColor="hsl(25 95% 53%)"
        loadInfo={loadInfo.heavy}
        onTogglePower={toggleSocketPower}
        onAddSocket={(name) => addSocket('heavy', name)}
        onUpdateSocketName={updateSocketName}
        onRemoveSocket={removeSocket}
        idPrefix="ESP"
        isLoading={isLoading}
      />
      <LoadCard
        title="Universal Load"
        icon={<Plug className="w-6 h-6" />}
        sockets={sockets.universal}
        chartColor="#3498db"
        loadInfo={loadInfo.universal}
        onTogglePower={toggleSocketPower}
        onAddSocket={(name) => addSocket('universal', name)}
        onUpdateSocketName={updateSocketName}
        onRemoveSocket={removeSocket}
        idPrefix="ESP"
        isLoading={isLoading}
      />
    </div>
  );
}
