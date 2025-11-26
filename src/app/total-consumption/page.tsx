
'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TotalConsumption } from "@/components/total-consumption";
import { Header } from "@/components/header";
import { suppliers } from "@/lib/suppliers";
import { useLaravelAuth } from "@/components/LaravelAuthContext";

export default function TotalConsumptionPage() {
  const [rate, setRate] = useState(suppliers[0].rate);
  const { isAuthenticated, isLoading } = useLaravelAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full">
      <Header rate={rate} setRate={setRate} />
      <main className="px-4 pb-4 md:px-8 md:pb-8 text-left">
        <TotalConsumption rate={rate} />
      </main>
    </div>
  );
}
