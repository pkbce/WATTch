
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from './ui/button';

interface LoadInfoDialogProps {
  children: React.ReactNode;
  title: string;
  appliances: string[];
}

export function LoadInfoDialog({
  children,
  title,
  appliances,
}: LoadInfoDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            This load typically supports the following types of appliances:
          </DialogDescription>
        </DialogHeader>
        <ul className="list-disc list-inside space-y-2 py-4">
          {appliances.map((appliance, index) => (
            <li key={index}>{appliance}</li>
          ))}
        </ul>
        <DialogClose asChild>
          <Button type="button" variant="outline" className='mt-4'>
            Close
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
