{{-- filepath: /Users/flashcode/Desktop/REKAP DESKTOP/project-siska/resources/views/receipt/thermal-print.blade.php --}}
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=80mm, initial-scale=1.0">
    <title>Thermal Receipt - {{ $penjualan->nomor_invoice }}</title>
    <style>
        /* Reset all margins and paddings */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        /* Force thermal paper size */
        @page {
            size: 80mm auto;
            margin: 0;
        }
        
        html, body {
            width: 80mm;
            font-family: 'Courier New', 'Consolas', monospace;
            font-size: 10px;
            line-height: 1.2;
            color: #000;
            background: white;
        }
        
        .receipt {
            width: 80mm;
            padding: 2mm;
            background: white;
        }
        
        .center { text-align: center; }
        .left { text-align: left; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        
        .line {
            border-bottom: 1px dashed #000;
            margin: 2px 0;
            height: 1px;
        }
        
        .store-header {
            text-align: center;
            margin-bottom: 4px;
        }
        
        .store-name {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 1px;
        }
        
        .store-info {
            font-size: 8px;
            line-height: 1.1;
        }
        
        .transaction-info {
            font-size: 8px;
            margin: 3px 0;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin: 1px 0;
        }
        
        .item {
            margin: 2px 0;
            page-break-inside: avoid;
        }
        
        .item-name {
            font-weight: bold;
            font-size: 9px;
            word-break: break-word;
        }
        
        .item-code {
            font-size: 7px;
            color: #666;
        }
        
        .item-detail {
            display: flex;
            justify-content: space-between;
            font-size: 8px;
            margin: 1px 0;
        }
        
        .item-left {
            flex: 1;
        }
        
        .item-right {
            text-align: right;
            font-weight: bold;
        }
        
        .totals {
            font-size: 8px;
            margin: 3px 0;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            margin: 1px 0;
        }
        
        .grand-total {
            font-weight: bold;
            font-size: 10px;
            border-top: 1px solid #000;
            padding-top: 1px;
            margin-top: 2px;
        }
        
        .footer {
            text-align: center;
            font-size: 7px;
            margin-top: 4px;
            line-height: 1.1;
        }
        
        /* Print-specific styles */
        @media print {
            @page {
                size: 80mm auto;
                margin: 0;
            }
            
            body {
                width: 80mm;
            }
            
            .no-print {
                display: none !important;
            }
            
            .receipt {
                padding: 1mm;
            }
        }
        
        /* Control buttons */
        .print-controls {
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 1000;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 8px;
            padding: 8px;
        }
        
        .btn {
            margin: 0 4px;
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
        }
        
        .btn-print {
            background: #28a745;
            color: white;
        }
        
        .btn-download {
            background: #007bff;
            color: white;
        }
        
        .btn-close {
            background: #dc3545;
            color: white;
        }
        
        .btn:hover {
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <!-- Print Controls -->
    <div class="print-controls no-print">
        <button class="btn btn-print" onclick="printThermal()">🖨️ Print</button>
        <button class="btn btn-download" onclick="downloadThermal()">📄 Download</button>
        <button class="btn btn-close" onclick="window.close()">✖️ Close</button>
    </div>

    <div class="receipt">
        <!-- Store Header -->
        <div class="store-header">
            <div class="store-name">{{ $toko['nama'] }}</div>
            <div class="store-info">
                {{ $toko['alamat'] }}<br>
                Tel: {{ $toko['telepon'] }}<br>
                {{ $toko['email'] }}
            </div>
        </div>
        
        <div class="line"></div>
        
        <!-- Transaction Info -->
        <div class="transaction-info">
            <div class="info-row">
                <span>No. Invoice:</span>
                <span class="bold">{{ $penjualan->nomor_invoice }}</span>
            </div>
            <div class="info-row">
                <span>Tanggal:</span>
                <span>{{ $penjualan->tanggal_penjualan->format('d/m/Y H:i') }}</span>
            </div>
            <div class="info-row">
                <span>Kasir:</span>
                <span>{{ $penjualan->kasir->name }}</span>
            </div>
            @if($penjualan->pelanggan)
            <div class="info-row">
                <span>Pelanggan:</span>
                <span>{{ $penjualan->pelanggan->nama_pelanggan }}</span>
            </div>
            @endif
        </div>
        
        <div class="line"></div>
        
        <!-- Items -->
        @foreach($penjualan->detailPenjualan as $detail)
        <div class="item">
            <div class="item-name">{{ $detail->produk->nama_produk }}</div>
            <div class="item-code">{{ $detail->produk->kode_produk }}</div>
            <div class="item-detail">
                <div class="item-left">
                    {{ $detail->jumlah_beli }} x Rp {{ number_format($detail->harga_satuan, 0, ',', '.') }}
                    @if($detail->diskon_item > 0)
                        <br><span style="font-size: 7px;">Disc: -Rp {{ number_format($detail->diskon_item, 0, ',', '.') }}</span>
                    @endif
                </div>
                <div class="item-right">
                    Rp {{ number_format($detail->subtotal, 0, ',', '.') }}
                </div>
            </div>
            @if($detail->catatan_item)
            <div style="font-size: 7px; font-style: italic;">
                Note: {{ $detail->catatan_item }}
            </div>
            @endif
        </div>
        @if(!$loop->last)
        <div style="border-bottom: 1px dotted #ccc; margin: 1px 0;"></div>
        @endif
        @endforeach
        
        <div class="line"></div>
        
        <!-- Totals -->
        <div class="totals">
            <div class="total-row">
                <span>Subtotal:</span>
                <span>Rp {{ number_format($penjualan->total_belanja, 0, ',', '.') }}</span>
            </div>
            @if($penjualan->diskon_nominal > 0)
            <div class="total-row">
                <span>Diskon
                    @if($penjualan->diskon_persen > 0)
                        ({{ number_format($penjualan->diskon_persen, 0) }}%):
                    @else
                        :
                    @endif
                </span>
                <span>-Rp {{ number_format($penjualan->diskon_nominal, 0, ',', '.') }}</span>
            </div>
            @endif
            @if($penjualan->pajak_nominal > 0)
            <div class="total-row">
                <span>Pajak ({{ number_format($penjualan->pajak_persen, 0) }}%):</span>
                <span>Rp {{ number_format($penjualan->pajak_nominal, 0, ',', '.') }}</span>
            </div>
            @endif
            <div class="total-row grand-total">
                <span>TOTAL:</span>
                <span>Rp {{ number_format($penjualan->total_bayar, 0, ',', '.') }}</span>
            </div>
            <div class="total-row">
                <span>Bayar ({{ ucfirst(str_replace('_', ' ', $penjualan->metode_pembayaran)) }}):</span>
                <span>Rp {{ number_format($penjualan->jumlah_dibayar, 0, ',', '.') }}</span>
            </div>
            <div class="total-row bold">
                <span>Kembalian:</span>
                <span>Rp {{ number_format($penjualan->kembalian, 0, ',', '.') }}</span>
            </div>
        </div>
        
        @if($penjualan->catatan_penjualan)
        <div class="line"></div>
        <div style="font-size: 7px;">
            <strong>Catatan:</strong><br>
            {{ $penjualan->catatan_penjualan }}
        </div>
        @endif
        
        <div class="line"></div>
        
        <!-- Footer -->
        <div class="footer">
            Terima kasih atas kunjungan Anda!<br>
            Barang yang sudah dibeli tidak dapat dikembalikan<br><br>
            {{ $penjualan->nomor_invoice }}<br>
            Powered by SISKA POS
        </div>
    </div>

    <script>
        function printThermal() {
            // Hide controls before printing
            document.querySelector('.print-controls').style.display = 'none';
            
            // Set print-specific CSS
            const printCSS = `
                @page {
                    size: 80mm auto;
                    margin: 0;
                }
                body {
                    margin: 0;
                    padding: 0;
                }
                .receipt {
                    padding: 1mm;
                }
            `;
            
            const style = document.createElement('style');
            style.textContent = printCSS;
            document.head.appendChild(style);
            
            // Print
            window.print();
            
            // Show controls after printing
            setTimeout(() => {
                document.querySelector('.print-controls').style.display = 'block';
                document.head.removeChild(style);
            }, 1000);
        }
        
        function downloadThermal() {
            // Download thermal text file
            window.open('/pos/thermal-text/{{ $penjualan->id }}', '_blank');
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                printThermal();
            }
            if (e.key === 'Escape') {
                window.close();
            }
        });
        
        // Auto-print option (uncomment if needed)
        // window.addEventListener('load', function() {
        //     setTimeout(printThermal, 1000);
        // });
    </script>
</body>
</html>