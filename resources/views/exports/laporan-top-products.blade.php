{{-- filepath: /Users/flashcode/Desktop/REKAP DESKTOP/project-siska/resources/views/exports/laporan-top-products.blade.php --}}
<table>
    <thead>
        <tr>
            <th colspan="8" style="background-color: #FFC107; color: black; font-weight: bold;">
                TOP PRODUK TERLARIS
            </th>
        </tr>
        <tr>
            <th colspan="8" style="background-color: #FFF3CD; font-style: italic;">
                Periode: {{ $periode }}
            </th>
        </tr>
        <tr></tr>
        <tr>
            <th style="background-color: #FFC107; color: black;">Ranking</th>
            <th style="background-color: #FFC107; color: black;">Kode Produk</th>
            <th style="background-color: #FFC107; color: black;">Nama Produk</th>
            <th style="background-color: #FFC107; color: black;">Kategori</th>
            <th style="background-color: #FFC107; color: black;">Total Terjual</th>
            <th style="background-color: #FFC107; color: black;">Total Pendapatan</th>
            <th style="background-color: #FFC107; color: black;">Jumlah Transaksi</th>
            <th style="background-color: #FFC107; color: black;">Rata-rata Qty/Transaksi</th>
        </tr>
    </thead>
    <tbody>
        @foreach($topProducts as $index => $product)
        <tr>
            <td>{{ $index + 1 }}</td>
            <td>{{ $product->kode_produk }}</td>
            <td>{{ $product->nama_produk }}</td>
            <td>{{ $product->nama_kategori ?? 'Tanpa Kategori' }}</td>
            <td>{{ number_format($product->total_sold) }}</td>
            <td>{{ number_format($product->total_revenue) }}</td>
            <td>{{ number_format($product->total_transactions) }}</td>
            <td>{{ number_format($product->avg_qty_per_transaction, 2) }}</td>
        </tr>
        @endforeach
    </tbody>
</table>