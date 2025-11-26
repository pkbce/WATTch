
"use client";

import { ReactNode, useEffect, useState, useMemo } from "react";
import { Power, HelpCircle, ChevronLeft, ChevronRight, Plus, Minus, Loader2 } from "lucide-react";
import { Area, AreaChart, YAxis, XAxis } from "recharts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { LoadInfoDialog } from "./load-info-dialog";
import type { Socket } from './dashboard-client';
import { EditableSocketName } from "./editable-socket-name";
import { AddSocketDialog } from "./add-socket-dialog";
import { RemoveSocketDialog } from "./remove-socket-dialog";
import { Skeleton } from "./ui/skeleton";

interface LoadCardProps {
  title: string;
  icon: ReactNode;
  sockets: Socket[];
  chartColor?: string;
  loadInfo: {
    title: string;
    appliances: string[];
  };
  onTogglePower: (socketId: string) => void;
  onAddSocket: (name: string, id: string) => void;
  onUpdateSocketName: (socketId: string, newName: string) => void;
  onRemoveSocket: (socketId: string) => void;
  idPrefix: string;
  isLoading: boolean;
}

export function LoadCard({
  title,
  icon,
  sockets,
  chartColor,
  loadInfo,
  onTogglePower,
  onAddSocket,
  onUpdateSocketName,
  onRemoveSocket,
  idPrefix,
  isLoading,
}: LoadCardProps) {
  const [currentSocketIndex, setCurrentSocketIndex] = useState(0);
  const [isReceiving, setIsReceiving] = useState(false);
  const [hasReceived, setHasReceived] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  const nextSocketId = useMemo(() => {
    if (sockets.length === 0) {
      return `${idPrefix}00`;
    }
    const lastId = sockets.reduce((maxId, socket) => {
      return socket.id > maxId ? socket.id : maxId;
    }, sockets[0].id);

    const lastNumber = parseInt(lastId.slice(2), 10);
    const newNumber = lastNumber + 1;
    return `${idPrefix}${newNumber.toString().padStart(2, '0')}`;
  }, [sockets, idPrefix]);

  useEffect(() => {
    if (currentSocketIndex >= sockets.length && sockets.length > 0) {
      setCurrentSocketIndex(0);
    } else if (sockets.length === 0) {
    }
  }, [sockets, currentSocketIndex]);

  const handleNextSocket = () => {
    setCurrentSocketIndex((prev) => (prev + 1) % sockets.length);
  };

  const handlePrevSocket = () => {
    setCurrentSocketIndex((prev) => (prev - 1 + sockets.length) % sockets.length);
  };


  const currentSocket = sockets.length > 0 ? sockets[currentSocketIndex] : null;
  const latestConsumption = currentSocket ? currentSocket.currentPower : 0;

  // Track data reception and timer for label
  // Reset hasReceived when socket changes
  useEffect(() => {
    setHasReceived(false);
    setIsReceiving(false);
    if (timer) clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSocketIndex]);

  useEffect(() => {
    if (!currentSocket) return;
    // If data changes, reset timer and set receiving
    if (currentSocket.data && currentSocket.data.length > 0) {
      setIsReceiving(true);
      setHasReceived(true);
      if (timer) clearTimeout(timer);
      const newTimer = setTimeout(() => {
        setIsReceiving(false);
      }, 3000);
      setTimer(newTimer);
      return () => {
        if (newTimer) clearTimeout(newTimer);
      };
    }
  }, [currentSocket?.data?.length]);

  const activeSocketsCount = sockets.filter(socket =>
    socket.isPoweredOn && socket.currentPower > 0 && socket.isOnline
  ).length;

  const chartConfig = {
    consumption: {
      label: "Consumption (W)",
      color: chartColor || "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  const cardHeader = (
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <div className="flex items-center gap-3">
        {icon}
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        <LoadInfoDialog title={loadInfo.title} appliances={loadInfo.appliances}>
          <button>
            <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </button>
        </LoadInfoDialog>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            activeSocketsCount > 0 ? "bg-green-500" : "bg-muted"
          )}
          style={{
            boxShadow:
              activeSocketsCount > 0
                ? "0 0 8px 1px rgba(34, 197, 94, 0.5)"
                : "none",
          }}
        />
        <p className="text-sm font-medium text-muted-foreground">
          {activeSocketsCount > 0 ? `Active: ${activeSocketsCount}` : "Inactive"}
        </p>
      </div>
    </CardHeader>
  );

  if (isLoading) {
    return (
      <Card className="flex flex-col rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 min-h-[480px]">
        {cardHeader}
        <CardContent className="flex-1 flex flex-col justify-center items-center">
          <div className="flex flex-col items-center gap-4 w-full">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="h-[150px] w-full flex items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            </div>
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-center items-center pt-4">
          <Skeleton className="h-10 w-48" />
        </CardFooter>
      </Card>
    )
  }

  const emptyStateCard = (
    <Card className="flex flex-col rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 min-h-[480px]">
      {cardHeader}
      <CardContent className="flex-1 flex flex-col justify-center items-center">
        <p className="text-muted-foreground mb-4">No sockets available.</p>
        <AddSocketDialog onAddSocket={onAddSocket} nextSocketId={nextSocketId}>
          <Button className="dark:text-foreground text-black hover:bg-muted dark:hover:bg-accent">
            <Plus className="w-4 h-4 mr-2" />
            Add Socket
          </Button>
        </AddSocketDialog>
      </CardContent>
    </Card>
  );

  if (sockets.length === 0) {
    return emptyStateCard;
  }

  return (
    <Card className="flex flex-col rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 min-h-[480px]">
      {cardHeader}
      <CardContent className="flex-1 flex flex-col justify-between pt-2">
        <div className="flex justify-between items-start my-2">
          <div>
            <EditableSocketName
              socket={currentSocket!}
              onUpdateSocketName={onUpdateSocketName}
            />
            <div className="text-xs text-muted-foreground px-2">
              {currentSocketIndex + 1} / {sockets.length}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground pt-1">ID: {currentSocket!.id}</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevSocket} disabled={sockets.length <= 1} className="hover:bg-transparent hover:text-foreground hover:border-foreground">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="h-[150px] w-full">
            <ChartContainer config={chartConfig} className="w-full h-full">
              <AreaChart
                accessibilityLayer
                data={currentSocket!.data}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id={`color-${title.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-consumption)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-consumption)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <YAxis domain={["auto", "auto"]} hide />
                <ChartTooltip
                  cursor={true}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      indicator="dot"
                      formatter={(value) => [
                        `${Number(value).toFixed(0)} W`,
                        "Consumption",
                      ]}
                    />
                  }
                />
                <Area
                  dataKey="consumption"
                  type="monotone"
                  fill={`url(#color-${title.replace(/\s/g, "")})`}
                  stroke="var(--color-consumption)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: `var(--color-consumption)`, strokeWidth: 0 }}
                  isAnimationActive={true}
                  animationDuration={300}
                />
              </AreaChart>
            </ChartContainer>
          </div>
          <Button variant="outline" size="icon" onClick={handleNextSocket} disabled={sockets.length <= 1} className="hover:bg-transparent hover:text-foreground hover:border-foreground">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-center mt-4">
          <p className="text-4xl font-bold tracking-tighter">
            {currentSocket!.isPoweredOn && currentSocket!.data.length > 0 ? latestConsumption.toFixed(0) : "0"} W
          </p>
          <CardDescription>
            {(!hasReceived || latestConsumption === 0) ? "No Consumption" : isReceiving ? "Current Consumption" : "Last Consumption"}
          </CardDescription>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between items-center pt-4">
        <div className="flex-1"></div>
        <div className="flex items-center flex-1 justify-center">
          <RemoveSocketDialog
            socket={currentSocket!}
            onRemoveSocket={onRemoveSocket}
          >
            <Button variant="outline" size="icon" className="rounded-r-none text-black dark:text-white hover:bg-destructive/20 hover:border-destructive">
              <Minus className="w-4 h-4 text-black dark:text-white" />
            </Button>
          </RemoveSocketDialog>
          <Button
            variant="outline"
            onClick={() => onTogglePower(currentSocket!.id)}
            aria-label={`Toggle ${currentSocket!.name} power`}
            className={cn(
              "w-24 transition-all duration-300 rounded-none",
              currentSocket!.isPoweredOn
                ? "text-accent border-accent hover:bg-accent/10 hover:text-accent"
                : "text-muted-foreground"
            )}
          >
            <Power className="w-4 h-4 mr-2" />
            {currentSocket!.isPoweredOn ? "ON" : "OFF"}
          </Button>
          <AddSocketDialog onAddSocket={onAddSocket} nextSocketId={nextSocketId}>
            <Button variant="outline" size="icon" className="rounded-l-none text-black dark:text-white hover:bg-blue-400/20 hover:border-blue-400">
              <Plus className="w-4 h-4 text-black dark:text-white" />
            </Button>
          </AddSocketDialog>
        </div>
        <div className="text-sm text-muted-foreground flex-1 text-right">
        </div>
      </CardFooter>
    </Card>
  );
}
