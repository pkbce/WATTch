
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
import { Label } from './ui/label';

interface AddSocketDialogProps {
  children: React.ReactNode;
  onAddSocket: (name: string, id: string) => void;
  nextSocketId: string;
}

export function AddSocketDialog({ children, onAddSocket, nextSocketId }: AddSocketDialogProps) {
  const [name, setName] = useState('');

  const handleSave = () => {
    if (name) {
      onAddSocket(name, nextSocketId);
      setName('');
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Socket</DialogTitle>
          <DialogDescription>
            Enter the details for the new socket.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <Input
              id="socket-name"
              placeholder="Socket Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          <p className="text-xs text-muted-foreground mt-2">
            Note: Adding sockets requires the assistance of a professional. Do not attempt unless you have technical experience.
          </p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button type="submit" onClick={handleSave} disabled={!name}>
              Save changes
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
