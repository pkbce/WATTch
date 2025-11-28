'use client';

import { useState, useEffect } from 'react';
import { useLaravelAuth } from '@/components/LaravelAuthContext';
import { API_BASE_URL } from '../lib/config';

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
    const { user, token } = useLaravelAuth();
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
                    `${API_BASE_URL}/consumption/history?interval=${interval}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        }
                    }
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
