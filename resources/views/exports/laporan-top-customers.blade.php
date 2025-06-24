{{-- filepath: /Users/flashcode/Desktop/REKAP DESKTOP/project-siska/resources/views/exports/laporan-top-customers.blade.php --}}
<table>
    <thead>
        <tr>
            <th colspan="7" style="background-color: #17A2B8; color: white; font-weight: bold;">
                TOP PELANGGAN
            </th>
        </tr>
        <tr>
            <th colspan="7" style="background-color: #D1ECF1; font-style: italic;">
                Periode: {{ $periode }}
            </th>
        </tr>
        <tr></tr>
        <tr>
            <th style="background-color: #17A2B8; color: white;">Ranking</th>
            <th style="background-color: #17A2B8; color: white;">Kode Pelanggan</th>
            <th style="background-color: #17A2B8; color: white;">Nama Pelanggan</th>
            <th style="background-color: #17A2B8; color: white;">Email</th>
            <th style="background-color: #17A2B8; color: white;">Total Pembelian</th>
            <th style="background-color: #17A2B8; color: white;">Jumlah Transaksi</th>
            <th style="background-color: #17A2B8; color: white;">Transaksi Terakhir</th>
        </tr>
    </thead>
    <tbody>
        @foreach($topCustomers as $index => $customer)
        <tr>
            <td>{{ $index + 1 }}</td>
            <td>{{ $customer['kode'] }}</td>
            <td>{{ $customer['nama'] }}</td>
            <td>{{ $customer['email'] }}</td>
            <td>{{ number_format($customer['total_spent']) }}</td>
            <td>{{ number_format($customer['total_transactions']) }}</td>
            <td>{{ $customer['last_transaction'] }}</td>
        </tr>
        @endforeach
    </tbody>
</table>