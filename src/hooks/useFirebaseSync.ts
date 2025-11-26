'use client';

import { useEffect, useRef } from 'react';
import { useLaravelAuth } from '@/components/LaravelAuthContext';

/**
 * Custom hook to sync Firebase power readings to Laravel database
 * Debounces updates to avoid overwhelming the backend
 */
export function useFirebaseSync(
    loadType: 'light' | 'medium' | 'heavy' | 'universal',
    socketId: string,
    currentPower: number
) {
    const { user } = useLaravelAuth();
    const lastSyncTime = useRef<number>(0);
    const lastPower = useRef<number>(0);
    const accumulatedTime = useRef<number>(0);

    useEffect(() => {
        if (!user || !socketId) return;

        const now = Date.now();
        const timeSinceLastSync = (now - lastSyncTime.current) / 1000; // seconds

        // Sync every 10 seconds or when power reading changes significantly
        const shouldSync =
            timeSinceLastSync >= 10 ||
            Math.abs(currentPower - lastPower.current) > 5;

        if (shouldSync && lastSyncTime.current > 0) {
            // Calculate duration for this reading
            accumulatedTime.current += timeSinceLastSync;

            // Sync to database
            syncToDatabase(
                user.name,
                loadType,
                socketId,
                lastPower.current,
                timeSinceLastSync
            );

            lastSyncTime.current = now;
            lastPower.current = currentPower;
            accumulatedTime.current = 0;
        } else if (lastSyncTime.current === 0) {
            // Initialize
            lastSyncTime.current = now;
            lastPower.current = currentPower;
        }
    }, [currentPower, user, loadType, socketId]);

    const syncToDatabase = async (
        dbName: string,
        load: string,
        socket: string,
        power: number,
        durationSeconds: number
    ) => {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/consumption/sync-firebase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: dbName,
                    load_type: load,
                    socket_id: socket,
                    power: power,
                    duration_seconds: durationSeconds,
                }),
            });

            if (!response.ok) {
                console.error('Failed to sync Firebase data to database');
            } else {
                const data = await response.json();
                console.log('Synced to database:', data);
            }
        } catch (error) {
            console.error('Error syncing to database:', error);
        }
    };
}
