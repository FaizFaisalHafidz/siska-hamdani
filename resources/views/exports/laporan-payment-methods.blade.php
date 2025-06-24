{{-- filepath: /Users/flashcode/Desktop/REKAP DESKTOP/project-siska/resources/views/exports/laporan-payment-methods.blade.php --}}
<table>
    <thead>
        <tr>
            <th colspan="5" style="background-color: #6F42C1; color: white; font-weight: bold;">
                ANALISIS METODE PEMBAYARAN
            </th>
        </tr>
        <tr>
            <th colspan="5" style="background-color: #E2E3F7; font-style: italic;">
                Periode: {{ $periode }}
            </th>
        </tr>
        <tr></tr>
        <tr>
            <th style="background-color: #6F42C1; color: white;">Metode Pembayaran</th>
            <th style="background-color: #6F42C1; color: white;">Total Transaksi</th>
            <th style="background-color: #6F42C1; color: white;">Total Pendapatan</th>
            <th style="background-color: #6F42C1; color: white;">Rata-rata per Transaksi</th>
            <th style="background-color: #6F42C1; color: white;">Persentase</th>
        </tr>
    </thead>
    <tbody>
        @foreach($paymentMethods as $payment)
        <tr>
            <td>{{ $payment['method'] }}</td>
            <td>{{ number_format($payment['total_transactions']) }}</td>
            <td>{{ number_format($payment['total_revenue']) }}</td>
            <td>{{ number_format($payment['avg_transaction_value']) }}</td>
            <td>{{ number_format($payment['percentage'], 1) }}%</td>
        </tr>
        @endforeach
    </tbody>
</table>