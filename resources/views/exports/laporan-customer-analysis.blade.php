{{-- filepath: /Users/flashcode/Desktop/REKAP DESKTOP/project-siska/resources/views/exports/laporan-customer-analysis.blade.php --}}
<table>
    <thead>
        <tr>
            <th colspan="10" style="background-color: #DC3545; color: white; font-weight: bold;">
                ANALISIS DETAIL PELANGGAN
            </th>
        </tr>
        <tr>
            <th colspan="10" style="background-color: #F8D7DA; font-style: italic;">
                Periode: {{ $periode }}
            </th>
        </tr>
        <tr></tr>
        <tr>
            <th style="background-color: #DC3545; color: white;">Kode</th>
            <th style="background-color: #DC3545; color: white;">Nama</th>
            <th style="background-color: #DC3545; color: white;">Email</th>
            <th style="background-color: #DC3545; color: white;">Telepon</th>
            <th style="background-color: #DC3545; color: white;">Total Transaksi</th>
            <th style="background-color: #DC3545; color: white;">Total Pembelian</th>
            <th style="background-color: #DC3545; color: white;">Rata-rata/Transaksi</th>
            <th style="background-color: #DC3545; color: white;">Transaksi Pertama</th>
            <th style="background-color: #DC3545; color: white;">Transaksi Terakhir</th>
            <th style="background-color: #DC3545; color: white;">Frekuensi/Bulan</th>
        </tr>
    </thead>
    <tbody>
        @foreach($customerAnalysis as $customer)
        <tr>
            <td>{{ $customer['kode'] }}</td>
            <td>{{ $customer['nama'] }}</td>
            <td>{{ $customer['email'] }}</td>
            <td>{{ $customer['nomor_telepon'] }}</td>
            <td>{{ number_format($customer['total_transactions']) }}</td>
            <td>{{ number_format($customer['total_spent']) }}</td>
            <td>{{ number_format($customer['avg_transaction_value']) }}</td>
            <td>{{ $customer['first_transaction'] }}</td>
            <td>{{ $customer['last_transaction'] }}</td>
            <td>{{ $customer['frequency'] }}</td>
        </tr>
        @endforeach
    </tbody>
</table>