{{-- filepath: /Users/flashcode/Desktop/REKAP DESKTOP/project-siska/resources/views/receipt/thermal.blade.php --}}
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Receipt - {{ $penjualan->nomor_invoice }}</title>
    <style>
        /* Force thermal paper size */
        @page {
            size: 80mm auto;
            margin: 0;
            padding: 0;
        }
        
        * {
            box-sizing: border-box;
        }
        
        html, body {
            margin: 0;
            padding: 0;
            width: 80mm;
            font-family: 'Courier New', 'Consolas', monospace;
            font-size: 12px;
            line-height: 1.3;
            color: #000;
            background: white;
        }
        
        .receipt-container {
            width: 80mm;
            max-width: 80mm;
            padding: 5mm;
            margin: 0 auto;
            background: white;
        }
        
        .center {
            text-align: center;
        }
        
        .left {
            text-align: left;
        }
        
        .right {
            text-align: right;
        }
        
        .bold {
            font-weight: bold;
        }
        
        .line {
            border-bottom: 1px dashed #000;
            margin: 4px 0;
            width: 100%;
            height: 1px;
        }
        
        .small {
            font-size: 10px;
        }
        
        .smaller {
            font-size: 9px;
        }
        
        .header {
            margin-bottom: 6px;
        }
        
        .header .store-name {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 2px;
        }
        
        .transaction-info {
            margin: 6px 0;
        }
        
        .items-section {
            margin: 6px 0;
        }
        
        .totals-section {
            margin: 6px 0;
        }
        
        .footer {
            margin-top: 6px;
        }
        
        /* Info table */
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin: 2px 0;
        }
        
        .info-table td {
            padding: 1px 0;
            vertical-align: top;
            font-size: 10px;
        }
        
        .info-table .label {
            width: 45%;
        }
        
        .info-table .value {
            width: 55%;
            text-align: right;
        }
        
        /* Item styles */
        .item {
            margin: 3px 0;
            page-break-inside: avoid;
        }
        
        .item-name {
            font-weight: bold;
            font-size: 11px;
            word-wrap: break-word;
            margin-bottom: 1px;
        }
        
        .item-code {
            font-size: 9px;
            color: #666;
            margin-bottom: 1px;
        }
        
        .item-detail {
            width: 100%;
            border-collapse: collapse;
        }
        
        .item-detail td {
            padding: 0;
            vertical-align: top;
            font-size: 10px;
        }
        
        .item-qty-price {
            width: 60%;
        }
        
        .item-subtotal {
            width: 40%;
            text-align: right;
            font-weight: bold;
        }
        
        .item-separator {
            border-bottom: 1px dotted #ccc;
            margin: 2px 0;
            height: 1px;
        }
        
        /* Total table */
        .total-table {
            width: 100%;
            border-collapse: collapse;
            margin: 2px 0;
        }
        
        .total-table td {
            padding: 1px 0;
            vertical-align: top;
            font-size: 10px;
        }
        
        .total-table .total-label {
            width: 55%;
        }
        
        .total-table .total-value {
            width: 45%;
            text-align: right;
        }
        
        .grand-total {
            font-weight: bold;
            font-size: 12px;
            border-top: 1px solid #000;
            padding-top: 2px;
        }
        
        /* Print styles */
        @media print {
            @page {
                size: 80mm auto;
                margin: 0;
            }
            
            html, body {
                width: 80mm;
                margin: 0;
                padding: 0;
            }
            
            .receipt-container {
                width: 80mm;
                padding: 3mm;
            }
            
            .no-print {
                display: none !important;
            }
            
            /* Force black ink */
            * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        }
        
        /* Print button */
        .print-controls {
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 123, 255, 0.9);
            color: white;
            padding: 10px;
            border-radius: 8px;
            z-index: 1000;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        
        .print-button {
            background: #28a745;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            margin: 0 4px;
        }
        
        .print-button:hover {
            background: #218838;
        }
        
        .close-button {
            background: #dc3545;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            margin: 0 4px;
        }
        
        .close-button:hover {
            background: #c82333;
        }
        
        /* Screen only - preview mode */
        @media screen {
            body {
                background: #f5f5f5;
                padding: 20px 0;
            }
            
            .receipt-container {
                background: white;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                margin: 0 auto;
                border: 1px solid #ddd;
            }
        }
    </style>
</head>
<body>
    <div class="print-controls no-print">
        <button class="print-button" onclick="printReceipt()">🖨️ Print</button>
        <button class="close-button" onclick="window.close()">✖️ Close</button>
    </div>
    
    <div class="receipt-container">
        <!-- Header Toko -->
        <div class="header">
            <div class="center store-name">
                {{ $toko['nama'] }}
            </div>
            <div class="center small">
                {{ $toko['alamat'] }}
            </div>
            <div class="center smaller">
                Tel: {{ $toko['telepon'] }}
            </div>
            <div class="center smaller">
                {{ $toko['email'] }}
            </div>
        </div>
        
        <div class="line"></div>
        
        <!-- Info Transaksi -->
        <div class="transaction-info">
            <table class="info-table">
                <tr>
                    <td class="label">No. Invoice:</td>
                    <td class="value bold">{{ $penjualan->nomor_invoice }}</td>
                </tr>
                <tr>
                    <td class="label">Tanggal:</td>
                    <td class="value">{{ $penjualan->tanggal_penjualan->format('d/m/Y H:i') }}</td>
                </tr>
                <tr>
                    <td class="label">Kasir:</td>
                    <td class="value">{{ $penjualan->kasir->name }}</td>
                </tr>
                @if($penjualan->pelanggan)
                <tr>
                    <td class="label">Pelanggan:</td>
                    <td class="value">{{ $penjualan->pelanggan->nama_pelanggan }}</td>
                </tr>
                @endif
            </table>
        </div>
        
        <div class="line"></div>
        
        <!-- Items -->
        <div class="items-section">
            @foreach($penjualan->detailPenjualan as $detail)
            <div class="item">
                <div class="item-name">{{ $detail->produk->nama_produk }}</div>
                <div class="item-code">{{ $detail->produk->kode_produk }}</div>
                <table class="item-detail">
                    <tr>
                        <td class="item-qty-price">
                            {{ $detail->jumlah_beli }} x Rp {{ number_format($detail->harga_satuan, 0, ',', '.') }}
                            @if($detail->diskon_item > 0)
                                <br><span class="smaller">Disc: -Rp {{ number_format($detail->diskon_item, 0, ',', '.') }}</span>
                            @endif
                        </td>
                        <td class="item-subtotal">
                            Rp {{ number_format($detail->subtotal, 0, ',', '.') }}
                        </td>
                    </tr>
                </table>
                @if($detail->catatan_item)
                <div class="smaller" style="font-style: italic; margin-top: 1px;">
                    Note: {{ $detail->catatan_item }}
                </div>
                @endif
            </div>
            @if(!$loop->last)
            <div class="item-separator"></div>
            @endif
            @endforeach
        </div>
        
        <div class="line"></div>
        
        <!-- Totals -->
        <div class="totals-section">
            <table class="total-table">
                <tr>
                    <td class="total-label">Subtotal:</td>
                    <td class="total-value">Rp {{ number_format($penjualan->total_belanja, 0, ',', '.') }}</td>
                </tr>
                @if($penjualan->diskon_nominal > 0)
                <tr>
                    <td class="total-label">
                        Diskon
                        @if($penjualan->diskon_persen > 0)
                            ({{ number_format($penjualan->diskon_persen, 0) }}%):
                        @else
                            :
                        @endif
                    </td>
                    <td class="total-value">-Rp {{ number_format($penjualan->diskon_nominal, 0, ',', '.') }}</td>
                </tr>
                @endif
                @if($penjualan->pajak_nominal > 0)
                <tr>
                    <td class="total-label">Pajak ({{ number_format($penjualan->pajak_persen, 0) }}%):</td>
                    <td class="total-value">Rp {{ number_format($penjualan->pajak_nominal, 0, ',', '.') }}</td>
                </tr>
                @endif
                <tr class="grand-total">
                    <td class="total-label">TOTAL:</td>
                    <td class="total-value">Rp {{ number_format($penjualan->total_bayar, 0, ',', '.') }}</td>
                </tr>
                <tr>
                    <td class="total-label">Bayar ({{ ucfirst(str_replace('_', ' ', $penjualan->metode_pembayaran)) }}):</td>
                    <td class="total-value">Rp {{ number_format($penjualan->jumlah_dibayar, 0, ',', '.') }}</td>
                </tr>
                <tr class="bold">
                    <td class="total-label">Kembalian:</td>
                    <td class="total-value">Rp {{ number_format($penjualan->kembalian, 0, ',', '.') }}</td>
                </tr>
            </table>
        </div>
        
        @if($penjualan->catatan_penjualan)
        <div class="line"></div>
        <div class="small">
            <strong>Catatan:</strong><br>
            {{ $penjualan->catatan_penjualan }}
        </div>
        @endif
        
        <div class="line"></div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="center small">
                Terima kasih atas kunjungan Anda!
            </div>
            <div class="center smaller">
                Barang yang sudah dibeli tidak dapat dikembalikan
            </div>
            <div class="center smaller" style="margin-top: 3px;">
                {{ $penjualan->nomor_invoice }}
            </div>
            <div class="center smaller">
                Powered by SISKA POS
            </div>
        </div>
    </div>

    <script>
        function printReceipt() {
            // Set print settings for thermal receipt
            const css = `
                @page {
                    size: 80mm auto;
                    margin: 0;
                }
                @media print {
                    .no-print { display: none !important; }
                    body { margin: 0; padding: 0; }
                }
            `;
            
            // Create a new style element
            const style = document.createElement('style');
            style.textContent = css;
            document.head.appendChild(style);
            
            // Trigger print
            window.print();
            
            // Remove the style element after printing
            setTimeout(() => {
                document.head.removeChild(style);
            }, 1000);
        }
        
        // Auto print when page loads (optional)
        window.addEventListener('load', function() {
            // Uncomment the line below for auto-print
            // setTimeout(printReceipt, 1000);
        });
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                printReceipt();
            }
            if (e.key === 'Escape') {
                window.close();
            }
        });
    </script>
</body>
</html>