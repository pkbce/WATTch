

'use client';
import { useState, useMemo } from 'react';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useConsumptionData } from '@/hooks/useConsumptionData';


type Interval = '1D' | '1W' | '1M' | '1Y';

type ChartDataItem = {
  time: string;
  light: number;
  medium: number;
  heavy: number;
  universal: number;
};

const chartConfig = {
  light: { label: 'Light', color: 'hsl(120 100% 35%)' },
  medium: { label: 'Medium', color: '#F1C40F' },
  heavy: { label: 'Heavy', color: 'hsl(25 95% 40%)' },
  universal: { label: 'Universal', color: '#3498db' },
  total: { label: 'Total', color: 'hsl(var(--accent))' },
} satisfies ChartConfig;

const hoursPerInterval: Record<Interval, number> = {
  '1D': 4,
  '1W': 24,
  '1M': 24 * 7,
  '1Y': 24 * 30.44, // Average days in a month
};

export function TotalConsumption({ rate }: { rate: number }) {
  const [interval, setInterval] = useState<Interval>('1D');
  const { data: consumptionData, isLoading, error } = useConsumptionData(interval);

  type ExtendedChartDataItem = ChartDataItem & { total: number };

  // Convert API data to chart format
  const chartData = useMemo<Record<Interval, ExtendedChartDataItem[]>>(() => {
    if (!consumptionData) {
      return {
        '1D': [],
        '1W': [],
        '1M': [],
        '1Y': [],
      };
    }

    //Transform time-bucketed data from backend to chart format
    const timePoints = consumptionData.light.map((point, index) => {
      const chartPoint: ExtendedChartDataItem = {
        time: point.time,
        light: consumptionData.light[index].value / 1000, // Convert to Wh
        medium: consumptionData.medium[index].value / 1000,
        heavy: consumptionData.heavy[index].value / 1000,
        universal: consumptionData.universal[index].value / 1000,
        total: 0
      };

      chartPoint.total = chartPoint.light + chartPoint.medium + chartPoint.heavy + chartPoint.universal;

      return chartPoint;
    });

    // Ensure unique time points to prevent key errors
    const uniqueTimePoints = timePoints.filter((point, index, self) =>
      index === self.findIndex((t) => t.time === point.time)
    );

    return {
      '1D': uniqueTimePoints,
      '1W': uniqueTimePoints,
      '1M': uniqueTimePoints,
      '1Y': uniqueTimePoints,
    };
  }, [consumptionData]);

  console.log('TotalConsumption chartData:', chartData[interval]);

  const billData = useMemo(() => {
    const data = chartData[interval];
    const hours = hoursPerInterval[interval];
    const loads = Object.keys(chartConfig).filter(load => load !== 'total') as Array<keyof ChartDataItem & string>;

    const totalKWhByLoad = loads.map((load) => {
      const totalWatts = data.reduce(
        (acc, item) => acc + ((item[load as keyof Omit<ExtendedChartDataItem, 'time'>] as number) || 0),
        0
      );
      const totalWattHours = totalWatts * hours;
      return totalWattHours / 1000;
    });

    const costs = totalKWhByLoad.map((kwh) => kwh * rate);
    const totalCost = costs.reduce((acc, cost) => acc + cost, 0);

    return {
      loads,
      costs,
      totalCost,
    };
  }, [interval, rate, chartData]);

  return (
    <Card className="mt-6 rounded-lg shadow-lg">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between md:items-center">
          <div>
            <CardTitle>Total Consumption</CardTitle>
            <CardDescription>
              Power consumption for each load type
            </CardDescription>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            {(['1D', '1W', '1M', '1Y'] as Interval[]).map((i) => (
              <Button
                key={i}
                variant={interval === i ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInterval(i)}
              >
                {i}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Loading consumption data...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-8">
            <p className="text-destructive">Error: {error}</p>
          </div>
        )}

        {!isLoading && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {(Object.keys(chartConfig) as (keyof typeof chartConfig)[]).map(
                (load) => (
                  <div key={load}>
                    <h3 className="text-lg font-medium mb-4 text-center capitalize">
                      {load} {load !== 'total' && 'Load'}
                    </h3>
                    <ChartContainer
                      config={{ [load]: chartConfig[load] }}
                      className="w-full h-[200px]"
                    >
                      <BarChart data={chartData[interval]}>
                        <XAxis
                          dataKey="time"
                          tickLine={false}
                          tickMargin={10}
                          axisLine={false}
                          tickFormatter={(value) => value}
                        />
                        <YAxis />
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent indicator="dot" />}
                        />
                        <Bar
                          dataKey={load}
                          fill={`var(--color-${load})`}
                          radius={4}
                        />
                      </BarChart>
                    </ChartContainer>
                  </div>
                )
              )}
            </div>
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-2">Estimated Bill</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Load Type</TableHead>
                    <TableHead className="text-right">Estimated Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billData.loads.map((load, index) => (
                    <TableRow key={load}>
                      <TableCell className="font-medium capitalize">{load}</TableCell>
                      <TableCell className="text-right">
                        ₱{billData.costs[index].toFixed(6)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">
                      ₱{billData.totalCost.toFixed(6)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
