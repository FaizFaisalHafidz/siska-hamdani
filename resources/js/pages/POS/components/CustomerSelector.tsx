import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown, User, UserPlus, X } from 'lucide-react';
import { useState } from 'react';

interface Customer {
    id: number;
    kode: string;
    nama: string;
    telepon: string;
    jenis: string;
    display: string;
}

interface Props {
    customers: Customer[];
    selectedCustomer: Customer | null;
    onCustomerSelect: (customer: Customer | null) => void;
}

export default function CustomerSelector({ customers, selectedCustomer, onCustomerSelect }: Props) {
    const [open, setOpen] = useState(false);

    return (
        <div className="space-y-3">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                    >
                        {selectedCustomer ? (
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span className="truncate">{selectedCustomer.nama}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-gray-500">
                                <UserPlus className="h-4 w-4" />
                                <span>Pilih pelanggan...</span>
                            </div>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0">
                    <Command>
                        <CommandInput placeholder="Cari pelanggan..." />
                        <CommandEmpty>Pelanggan tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                            <CommandItem
                                onSelect={() => {
                                    onCustomerSelect(null);
                                    setOpen(false);
                                }}
                            >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Pelanggan Umum
                                {!selectedCustomer && <Check className="ml-auto h-4 w-4" />}
                            </CommandItem>
                            {customers.map((customer) => (
                                <CommandItem
                                    key={customer.id}
                                    onSelect={() => {
                                        onCustomerSelect(customer);
                                        setOpen(false);
                                    }}
                                >
                                    <User className="mr-2 h-4 w-4" />
                                    <div className="flex-1">
                                        <p className="font-medium">{customer.nama}</p>
                                        <p className="text-xs text-gray-500">
                                            {customer.kode} • {customer.jenis}
                                        </p>
                                    </div>
                                    {selectedCustomer?.id === customer.id && (
                                        <Check className="ml-auto h-4 w-4" />
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </Command>
                </PopoverContent>
            </Popover>

            {selectedCustomer && (
                <div className="bg-blue-50 rounded-lg p-3 relative">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCustomerSelect(null)}
                        className="absolute top-1 right-1 h-6 w-6 p-0 hover:bg-red-100"
                    >
                        <X className="h-3 w-3" />
                    </Button>
                    <div className="pr-8">
                        <p className="font-medium text-blue-900">{selectedCustomer.nama}</p>
                        <p className="text-sm text-blue-700">{selectedCustomer.kode}</p>
                        <p className="text-xs text-blue-600">
                            {selectedCustomer.telepon} • {selectedCustomer.jenis}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}