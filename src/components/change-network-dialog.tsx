
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useRealtimeDatabase } from '@/components/FirebaseContext';
import { ref, update } from 'firebase/database';

export function ChangeNetworkDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();
  const { database } = useRealtimeDatabase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ssid || !password) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill in all fields.',
      });
      return;
    }

    if (!database) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Database connection failed.',
      });
      return;
    }

    setLoading(true);
    try {
      // Update WiFi credentials in Firebase
      const wifiRef = ref(database, 'WATTch/WiFi');
      await update(wifiRef, {
        SSID: ssid,
        password: password,
      });

      toast({
        title: 'Success',
        description: 'Network settings updated successfully.',
      });
      setSsid('');
      setPassword('');
      setOpen(false);
    } catch (error) {
      console.error('Error updating network:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update network settings.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Network</DialogTitle>
          <DialogDescription>
            Enter the new network details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ssid" className="text-right">
                SSID
              </Label>
              <Input
                id="ssid"
                className="col-span-3"
                value={ssid}
                onChange={(e) => setSsid(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                className="col-span-3"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
