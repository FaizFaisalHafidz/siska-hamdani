{{-- filepath: /Users/flashcode/Desktop/REKAP DESKTOP/project-siska/resources/views/exports/laporan-daily-detail.blade.php --}}
<table>
    <thead>
        <tr>
            <th colspan="8" style="background-color: #20C997; color: white; font-weight: bold;">
                DETAIL TRANSAKSI HARIAN
            </th>
        </tr>
        <tr>
            <th colspan="8" style="background-color: #D4F4EA; font-style: italic;">
                Tanggal: {{ $date }}
            </th>
        </tr>
        <tr></tr>
        <tr>
            <th style="background-color: #20C997; color: white;">No Invoice</th>
            <th style="background-color: #20C997; color: white;">Waktu</th>
            <th style="background-color: #20C997; color: white;">Pelanggan</th>
            <th style="background-color: #20C997; color: white;">Kasir</th>
            <th style="background-color: #20C997; color: white;">Total Item</th>
            <th style="background-color: #20C997; color: white;">Subtotal</th>
            <th style="background-color: #20C997; color: white;">Diskon</th>
            <th style="background-color: #20C997; color: white;">Total Bayar</th>
        </tr>
    </thead>
    <tbody>
        @foreach($transactions as $transaction)
        <tr>
            <td>{{ $transaction->nomor_invoice }}</td>
            <td>{{ $transaction->tanggal_penjualan->format('H:i:s') }}</td>
            <td>{{ $transaction->pelanggan ? $transaction->pelanggan->nama_pelanggan : 'Walk-in Customer' }}</td>
            <td>{{ $transaction->kasir->name }}</td>
            <td>{{ $transaction->detailPenjualan->sum('jumlah_beli') }}</td>
            <td>{{ number_format($transaction->total_belanja) }}</td>
            <td>{{ number_format($transaction->diskon_nominal) }}</td>
            <td>{{ number_format($transaction->total_bayar) }}</td>
        </tr>
        @endforeach
        
        <!-- Summary -->
        <tr style="background-color: #F8F9FA;">
            <td colspan="4" style="font-weight: bold;">TOTAL</td>
            <td style="font-weight: bold;">{{ $transactions->sum(function($t) { return $t->detailPenjualan->sum('jumlah_beli'); }) }}</td>
            <td style="font-weight: bold;">{{ number_format($transactions->sum('total_belanja')) }}</td>
            <td style="font-weight: bold;">{{ number_format($transactions->sum('diskon_nominal')) }}</td>
            <td style="font-weight: bold;">{{ number_format($transactions->sum('total_bayar')) }}</td>
        </tr>
    </tbody>
</table>