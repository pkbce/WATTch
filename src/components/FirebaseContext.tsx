'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { FirebaseApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, remove, Database, DataSnapshot } from 'firebase/database';
import { useFirebaseApp } from '@/firebase/provider';

interface RealtimeDatabaseContextType {
    database: Database | null;
    data: any;
    updateRelay: (path: string, status: boolean) => Promise<void>;
    setPower: (path: string, power: number) => Promise<void>;
    addDevice: (deviceId: string) => Promise<void>;
    removeDevice: (deviceId: string) => Promise<void>;
}

const RealtimeDatabaseContext = createContext<RealtimeDatabaseContextType>({
    database: null,
    data: null,
    updateRelay: async () => { },
    setPower: async () => { },
    addDevice: async () => { },
    removeDevice: async () => { },
});

export const useRealtimeDatabase = () => useContext(RealtimeDatabaseContext);

export function RealtimeDatabaseProvider({ children }: { children: ReactNode }) {
    const app = useFirebaseApp();
    const [database, setDatabase] = useState<Database | null>(null);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        if (!app) return;

        const db = getDatabase(app);
        setDatabase(db);

        const wattchRef = ref(db, 'WATTch');
        const unsubscribe = onValue(wattchRef, (snapshot: DataSnapshot) => {
            setData(snapshot.val());
        });

        return () => unsubscribe();
    }, [app]);

    const updateRelay = async (path: string, status: boolean) => {
        if (!database) return;
        const relayRef = ref(database, `WATTch/${path}/relay`);
        await set(relayRef, status);
    };

    const setPower = async (path: string, power: number) => {
        if (!database) return;
        const powerRef = ref(database, `WATTch/${path}/power`);
        await set(powerRef, power);
    };

    const addDevice = async (deviceId: string) => {
        if (!database) return;
        const deviceRef = ref(database, `WATTch/${deviceId}`);
        await set(deviceRef, {
            relay: false,
            power: 0
        });
    };

    const removeDevice = async (deviceId: string) => {
        if (!database) return;
        const deviceRef = ref(database, `WATTch/${deviceId}`);
        await remove(deviceRef);
    };

    return (
        <RealtimeDatabaseContext.Provider value={{ database, data, updateRelay, setPower, addDevice, removeDevice }}>
            {children}
        </RealtimeDatabaseContext.Provider>
    );
}
