{{-- filepath: /Users/flashcode/Desktop/REKAP DESKTOP/project-siska/resources/views/exports/laporan-daily-trend.blade.php --}}
<table>
    <thead>
        <tr>
            <th colspan="5" style="background-color: #28A745; color: white; font-weight: bold;">
                TREND PENJUALAN HARIAN
            </th>
        </tr>
        <tr>
            <th colspan="5" style="background-color: #E8F5E8; font-style: italic;">
                Periode: {{ $periode }}
            </th>
        </tr>
        <tr></tr>
        <tr>
            <th style="background-color: #28A745; color: white;">Tanggal</th>
            <th style="background-color: #28A745; color: white;">Hari</th>
            <th style="background-color: #28A745; color: white;">Total Transaksi</th>
            <th style="background-color: #28A745; color: white;">Total Pendapatan</th>
            <th style="background-color: #28A745; color: white;">Rata-rata per Transaksi</th>
        </tr>
    </thead>
    <tbody>
        @foreach($dailyTrend as $day)
        <tr>
            <td>{{ \Carbon\Carbon::parse($day['date'])->format('d/m/Y') }}</td>
            <td>{{ $day['day_name'] }}</td>
            <td>{{ number_format($day['total_transactions']) }}</td>
            <td>{{ 'Rp ' . number_format($day['total_revenue'], 0, ',', '.') }}</td>
            <td>{{ 'Rp ' . number_format($day['avg_transaction_value'], 0, ',', '.') }}</td>
        </tr>
        @endforeach
        
        <!-- Summary -->
        <tr style="background-color: #F8F9FA;">
            <td colspan="2" style="font-weight: bold;">TOTAL</td>
            <td style="font-weight: bold;">{{ number_format($dailyTrend->sum('total_transactions')) }}</td>
            <td style="font-weight: bold;">{{ 'Rp ' . number_format($dailyTrend->sum('total_revenue'), 0, ',', '.') }}</td>
            <td style="font-weight: bold;">{{ 'Rp ' . number_format($dailyTrend->avg('avg_transaction_value'), 0, ',', '.') }}</td>
        </tr>
    </tbody>
</table>