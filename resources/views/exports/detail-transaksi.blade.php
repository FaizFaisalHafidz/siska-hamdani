{{-- filepath: /Users/flashcode/Desktop/REKAP DESKTOP/project-siska/resources/views/exports/detail-transaksi.blade.php --}}
<table>
    <thead>
        <tr>
            <th style="background-color: #28A745; color: white; font-weight: bold;">No</th>
            <th style="background-color: #28A745; color: white; font-weight: bold;">Invoice</th>
            <th style="background-color: #28A745; color: white; font-weight: bold;">Tanggal</th>
            <th style="background-color: #28A745; color: white; font-weight: bold;">Pelanggan</th>
            <th style="background-color: #28A745; color: white; font-weight: bold;">Kasir</th>
            <th style="background-color: #28A745; color: white; font-weight: bold;">Kode Produk</th>
            <th style="background-color: #28A745; color: white; font-weight: bold;">Nama Produk</th>
            <th style="background-color: #28A745; color: white; font-weight: bold;">Qty</th>
            <th style="background-color: #28A745; color: white; font-weight: bold;">Harga Satuan</th>
            <th style="background-color: #28A745; color: white; font-weight: bold;">Diskon</th>
            <th style="background-color: #28A745; color: white; font-weight: bold;">Subtotal</th>
            <th style="background-color: #28A745; color: white; font-weight: bold;">Catatan</th>
        </tr>
    </thead>
    <tbody>
        @foreach($details as $index => $item)
        <tr>
            <td>{{ $index + 1 }}</td>
            <td>{{ $item['transaction']->nomor_invoice }}</td>
            <td>{{ $item['transaction']->tanggal_penjualan->format('d/m/Y H:i') }}</td>
            <td>{{ $item['transaction']->pelanggan ? $item['transaction']->pelanggan->nama_pelanggan : 'Walk-in Customer' }}</td>
            <td>{{ $item['transaction']->kasir->name }}</td>
            <td>{{ $item['detail']->produk ? $item['detail']->produk->kode_produk : 'DELETED' }}</td>
            <td>{{ $item['detail']->produk ? $item['detail']->produk->nama_produk : 'Produk Tidak Ditemukan' }}</td>
            <td>{{ $item['detail']->jumlah_beli }}</td>
            <td>{{ $item['detail']->harga_satuan }}</td>
            <td>{{ $item['detail']->diskon_item }}</td>
            <td>{{ $item['detail']->subtotal }}</td>
            <td>{{ $item['detail']->catatan_item ?? '' }}</td>
        </tr>
        @endforeach
        
        <!-- Export info -->
        <tr></tr>
        <tr>
            <td colspan="12" style="font-style: italic; color: #666;">
                Periode: {{ $exportInfo['periode'] }} | 
                Digenerate: {{ $exportInfo['generated_at'] }} | 
                Oleh: {{ $exportInfo['generated_by'] }}
            </td>
        </tr>
    </tbody>
</table>