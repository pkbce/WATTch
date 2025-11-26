
'use client';

import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { suppliers } from '@/lib/suppliers';
import { Label } from './ui/label';
import React from 'react';

interface SupplierSettingsProps {
  children: React.ReactNode;
  rate: number;
  setRate: (rate: number) => void;
}

export function SupplierSettings({ children, rate, setRate }: SupplierSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSupplierName, setSelectedSupplierName] = useState('');
  const [selectedRate, setSelectedRate] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const currentSupplier = suppliers.find((s) => s.rate === rate);
      if (currentSupplier) {
        setSelectedSupplierName(currentSupplier.name);
        setSelectedRate(currentSupplier.rate);
      } else {
        setSelectedSupplierName(suppliers[0].name);
        setSelectedRate(suppliers[0].rate);
      }
    }
  }, [isOpen, rate]);

  const handleSupplierChange = (supplierName: string) => {
    const selectedSupplier = suppliers.find(
      (supplier) => supplier.name === supplierName
    );
    if (selectedSupplier) {
      setSelectedSupplierName(selectedSupplier.name);
      setSelectedRate(selectedSupplier.rate);
    }
  };
  
  const handleApply = () => {
    setRate(selectedRate);
    setIsOpen(false);
  };

  const currentSupplier =
    suppliers.find((s) => s.rate === rate)?.name || suppliers[0].name;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild onClick={() => setIsOpen(true)}>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Supplier Settings</DialogTitle>
          <DialogDescription>
            Change your electricity supplier. The rate will be used to
            calculate your estimated bill.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="supplier-select" className="text-right">
              Supplier
            </Label>
            <Select
              onValueChange={handleSupplierChange}
              value={selectedSupplierName}
            >
              <SelectTrigger id="supplier-select" className="col-span-3">
                <SelectValue placeholder="Select a supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.name} value={supplier.name}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rate" className="text-right">
              Rate (₱)
            </Label>
            <Input 
              id="rate" 
              value={selectedRate.toFixed(4)} 
              className="col-span-3" 
              disabled 
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleApply}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
