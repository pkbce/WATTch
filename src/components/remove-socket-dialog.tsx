
'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Socket } from './dashboard-client';
import { useToast } from '@/components/ui/use-toast';

interface RemoveSocketDialogProps {
    children: React.ReactNode;
    socket: Socket;
    onRemoveSocket: (socketId: string) => void;
}

export function RemoveSocketDialog({ children, socket, onRemoveSocket }: RemoveSocketDialogProps) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();

    const handleRemove = () => {
        if (password === '' || confirmPassword === '') {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Please enter and confirm your password.',
            });
            return;
        }
        if (password !== confirmPassword) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Passwords do not match.',
            });
            return;
        }
        // Here you would typically verify the password against the user's actual password
        // For this mock, we'll just check if they match.
        console.log("Password verified. Removing socket.");
        onRemoveSocket(socket.id);
        setIsOpen(false);
        setPassword('');
        setConfirmPassword('');
        toast({
            title: 'Socket Removed',
            description: `Socket ${socket.name} (${socket.id}) has been removed.`,
        })
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            setPassword('');
            setConfirmPassword('');
        }
    }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild onClick={(e) => { e.stopPropagation(); setIsOpen(true) }}>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="grid gap-4 py-4">
          <Input id="password-remove" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
          <Input id="confirm-password-remove" type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          <AlertDialogDescription className="text-sm text-muted-foreground mt-2">
            This action cannot be undone. This will permanently delete the socket{' '}
            <span className="font-semibold text-foreground">{socket.name} ({socket.id})</span>.
            Please enter your password to confirm.
          </AlertDialogDescription>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRemove}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete Socket
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
