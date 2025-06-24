import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ArrowLeftRight,
    Banknote,
    Calculator,
    CheckCircle,
    CreditCard,
    DollarSign,
    Smartphone
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Props {
    open: boolean;
    onClose: () => void;
    total: number;
    onPayment: (paymentData: { method: string; amount: number; change: number }) => void;
}

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000];

const PAYMENT_METHODS = [
    { 
        id: 'tunai', 
        name: 'Tunai', 
        icon: Banknote, 
        color: 'bg-green-500',
        description: 'Pembayaran cash' 
    },
    { 
        id: 'kartu_debit', 
        name: 'Kartu Debit', 
        icon: CreditCard, 
        color: 'bg-blue-500',
        description: 'EDC/PIN' 
    },
    { 
        id: 'kartu_kredit', 
        name: 'Kartu Kredit', 
        icon: CreditCard, 
        color: 'bg-purple-500',
        description: 'Credit card' 
    },
    { 
        id: 'transfer', 
        name: 'Transfer Bank', 
        icon: ArrowLeftRight, 
        color: 'bg-orange-500',
        description: 'Transfer/M-Banking' 
    },
    { 
        id: 'qris', 
        name: 'QRIS', 
        icon: Smartphone, 
        color: 'bg-red-500',
        description: 'QR Code payment' 
    },
];

export default function PaymentDialog({ open, onClose, total, onPayment }: Props) {
    const [selectedMethod, setSelectedMethod] = useState('tunai');
    const [paidAmount, setPaidAmount] = useState<number>(0);
    const [isProcessing, setIsProcessing] = useState(false);

    // Helper function to ensure valid number
    const ensureNumber = (value: any): number => {
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
    };

    // Safe total calculation
    const safeTotal = ensureNumber(total);
    const safePaidAmount = ensureNumber(paidAmount);
    const change = safePaidAmount - safeTotal;
    const isValidPayment = safePaidAmount >= safeTotal && safeTotal > 0;

    // Reset when dialog opens
    useEffect(() => {
        if (open) {
            setSelectedMethod('tunai');
            setPaidAmount(safeTotal);
            setIsProcessing(false);
        }
    }, [open, safeTotal]);

    // Update paid amount when total changes
    useEffect(() => {
        if (selectedMethod !== 'tunai') {
            setPaidAmount(safeTotal);
        }
    }, [safeTotal, selectedMethod]);

    const handleMethodChange = (method: string) => {
        setSelectedMethod(method);
        if (method !== 'tunai') {
            setPaidAmount(safeTotal); // For non-cash payments, amount equals total
        }
    };

    const handleQuickAmount = (amount: number) => {
        setPaidAmount(amount);
    };

    const handlePaidAmountChange = (value: string) => {
        const numValue = ensureNumber(value);
        setPaidAmount(numValue);
    };

    const handleProcess = async () => {
        if (!isValidPayment) {
            toast.error('Jumlah pembayaran kurang dari total yang harus dibayar');
            return;
        }

        if (safeTotal <= 0) {
            toast.error('Total pembayaran tidak valid');
            return;
        }

        setIsProcessing(true);
        
        try {
            await onPayment({
                method: selectedMethod,
                amount: safePaidAmount,
                change: Math.max(0, change)
            });
        } catch (error) {
            toast.error('Terjadi kesalahan saat memproses pembayaran');
        } finally {
            setIsProcessing(false);
        }
    };

    const formatCurrency = (amount: number) => {
        const validAmount = ensureNumber(amount);
        return `Rp ${validAmount.toLocaleString('id-ID')}`;
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        Proses Pembayaran
                    </DialogTitle>
                    <DialogDescription>
                        Pilih metode pembayaran dan masukkan jumlah yang dibayarkan
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Total Amount Display */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                        <div className="text-center">
                            <p className="text-sm text-gray-600 mb-1">Total Pembayaran</p>
                            <p className="text-3xl font-bold text-blue-600">{formatCurrency(safeTotal)}</p>
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div>
                        <Label className="text-base font-semibold mb-3 block">Metode Pembayaran</Label>
                        <Tabs value={selectedMethod} onValueChange={handleMethodChange}>
                            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 h-auto p-1">
                                {PAYMENT_METHODS.map((method) => (
                                    <TabsTrigger 
                                        key={method.id} 
                                        value={method.id}
                                        className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-white"
                                    >
                                        <div className={`p-2 rounded-full ${method.color} text-white`}>
                                            <method.icon className="h-4 w-4" />
                                        </div>
                                        <span className="text-xs font-medium">{method.name}</span>
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            {PAYMENT_METHODS.map((method) => (
                                <TabsContent key={method.id} value={method.id} className="mt-4">
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`p-2 rounded-full ${method.color} text-white`}>
                                                <method.icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">{method.name}</h3>
                                                <p className="text-sm text-gray-600">{method.description}</p>
                                            </div>
                                        </div>

                                        {method.id === 'tunai' && (
                                            <div className="space-y-4">
                                                <div>
                                                    <Label className="text-sm font-medium mb-2 block">
                                                        Jumlah Dibayar
                                                    </Label>
                                                    <div className="relative">
                                                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                        <Input
                                                            type="number"
                                                            value={paidAmount}
                                                            onChange={(e) => handlePaidAmountChange(e.target.value)}
                                                            className="pl-10 text-lg font-semibold"
                                                            placeholder="0"
                                                            min={0}
                                                            step={1000}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Quick Amount Buttons */}
                                                <div>
                                                    <Label className="text-sm font-medium mb-2 block">
                                                        Jumlah Cepat
                                                    </Label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {QUICK_AMOUNTS.map((amount) => (
                                                            <Button
                                                                key={amount}
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleQuickAmount(amount)}
                                                                className="text-xs font-semibold"
                                                            >
                                                                {formatCurrency(amount)}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {method.id !== 'tunai' && (
                                            <div className="bg-white rounded-lg p-3 border-2 border-dashed border-gray-300">
                                                <div className="text-center">
                                                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                                                    <p className="text-sm font-medium">Pembayaran Exact Amount</p>
                                                    <p className="text-xs text-gray-600">
                                                        Pembayaran akan diproses sebesar {formatCurrency(safeTotal)}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </div>

                    {/* Payment Summary */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold mb-3">Ringkasan Pembayaran</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Total Tagihan:</span>
                                <span className="font-semibold">{formatCurrency(safeTotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Jumlah Dibayar:</span>
                                <span className="font-semibold">{formatCurrency(safePaidAmount)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold">
                                <span>Kembalian:</span>
                                <span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {formatCurrency(Math.max(0, change))}
                                </span>
                            </div>
                        </div>

                        {!isValidPayment && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-600 font-medium">
                                    ⚠️ Pembayaran kurang {formatCurrency(Math.abs(change))}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button 
                        variant="outline" 
                        onClick={onClose}
                        disabled={isProcessing}
                    >
                        Batal
                    </Button>
                    <Button 
                        onClick={handleProcess}
                        disabled={!isValidPayment || isProcessing}
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                    >
                        {isProcessing ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                Memproses...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Proses Pembayaran
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}