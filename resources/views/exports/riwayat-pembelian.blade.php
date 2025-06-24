{{-- filepath: /Users/flashcode/Desktop/REKAP DESKTOP/project-siska/resources/views/exports/riwayat-pembelian.blade.php --}}
<table>
    <thead>
        <tr>
            <th style="background-color: #4472C4; color: white; font-weight: bold;">No</th>
            <th style="background-color: #4472C4; color: white; font-weight: bold;">Invoice</th>
            <th style="background-color: #4472C4; color: white; font-weight: bold;">Pelanggan</th>
            <th style="background-color: #4472C4; color: white; font-weight: bold;">Kasir</th>
            <th style="background-color: #4472C4; color: white; font-weight: bold;">Tanggal</th>
            <th style="background-color: #4472C4; color: white; font-weight: bold;">Total Item</th>
            <th style="background-color: #4472C4; color: white; font-weight: bold;">Subtotal</th>
            <th style="background-color: #4472C4; color: white; font-weight: bold;">Diskon</th>
            <th style="background-color: #4472C4; color: white; font-weight: bold;">Total Bayar</th>
            <th style="background-color: #4472C4; color: white; font-weight: bold;">Metode</th>
            <th style="background-color: #4472C4; color: white; font-weight: bold;">Status</th>
        </tr>
    </thead>
    <tbody>
        @foreach($transactions as $index => $transaction)
        <tr>
            <td>{{ $index + 1 }}</td>
            <td>{{ $transaction->nomor_invoice }}</td>
            <td>{{ $transaction->pelanggan ? $transaction->pelanggan->nama_pelanggan : 'Walk-in Customer' }}</td>
            <td>{{ $transaction->kasir->name }}</td>
            <td>{{ $transaction->tanggal_penjualan->format('d/m/Y H:i') }}</td>
            <td>{{ $transaction->detailPenjualan->sum('jumlah_beli') }}</td>
            <td>{{ $transaction->total_belanja }}</td>
            <td>{{ $transaction->diskon_nominal }}</td>
            <td>{{ $transaction->total_bayar }}</td>
            <td>{{ ucfirst(str_replace('_', ' ', $transaction->metode_pembayaran)) }}</td>
            <td>{{ ucfirst($transaction->status_transaksi) }}</td>
        </tr>
        @endforeach
        
        <!-- Summary rows -->
        <tr style="background-color: #F8F9FA;">
            <td colspan="5" style="font-weight: bold;">RINGKASAN</td>
            <td style="font-weight: bold;">{{ $transactions->sum(function($t) { return $t->detailPenjualan->sum('jumlah_beli'); }) }}</td>
            <td style="font-weight: bold;">{{ $statistics['total_pendapatan'] + $statistics['total_diskon'] }}</td>
            <td style="font-weight: bold;">{{ $statistics['total_diskon'] }}</td>
            <td style="font-weight: bold;">{{ $statistics['total_pendapatan'] }}</td>
            <td colspan="2"></td>
        </tr>
        
        <!-- Export info -->
        <tr></tr>
        <tr>
            <td colspan="11" style="font-style: italic; color: #666;">
                Periode: {{ $exportInfo['periode'] }} | 
                Digenerate: {{ $exportInfo['generated_at'] }} | 
                Oleh: {{ $exportInfo['generated_by'] }}
            </td>
        </tr>
    </tbody>
</table>