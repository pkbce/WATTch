'use client';
'use client';

import { useState, useEffect } from 'react';
import { useLaravelAuth } from '@/components/LaravelAuthContext';

type Interval = '1D' | '1W' | '1M' | '1Y';

interface TimeDataPoint {
    time: string;
    value: number;
}

interface ConsumptionData {
    light: TimeDataPoint[];
    medium: TimeDataPoint[];
    heavy: TimeDataPoint[];
    universal: TimeDataPoint[];
}

export function useConsumptionData(interval: Interval) {
    const { user } = useLaravelAuth();
    const [data, setData] = useState<ConsumptionData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(
                    `http://127.0.0.1:8000/api/consumption/history?name=${user.name}&interval=${interval}`
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch consumption data');
                }

                const result = await response.json();
                setData(result.data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
                console.error('Error fetching consumption data:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user, interval]);

    return { data, isLoading, error };
}
