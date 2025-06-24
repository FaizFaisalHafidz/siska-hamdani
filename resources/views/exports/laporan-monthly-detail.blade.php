{{-- filepath: /Users/flashcode/Desktop/REKAP DESKTOP/project-siska/resources/views/exports/laporan-monthly-detail.blade.php --}}
<table>
    <thead>
        <tr>
            <th colspan="5" style="background-color: #6610F2; color: white; font-weight: bold;">
                DETAIL BULANAN
            </th>
        </tr>
        <tr>
            <th colspan="5" style="background-color: #E0CFFC; font-style: italic;">
                Bulan: {{ $month }}
            </th>
        </tr>
        <tr></tr>
        <tr>
            <th style="background-color: #6610F2; color: white;">Tanggal</th>
            <th style="background-color: #6610F2; color: white;">Hari</th>
            <th style="background-color: #6610F2; color: white;">Total Transaksi</th>
            <th style="background-color: #6610F2; color: white;">Total Pendapatan</th>
            <th style="background-color: #6610F2; color: white;">Rata-rata per Transaksi</th>
        </tr>
    </thead>
    <tbody>
        @foreach($monthlyData as $day)
        <tr>
            <td>{{ $day['date'] }}</td>
            <td>{{ $day['day_name'] }}</td>
            <td>{{ number_format($day['total_transactions']) }}</td>
            <td>{{ number_format($day['total_revenue']) }}</td>
            <td>{{ number_format($day['avg_transaction_value']) }}</td>
        </tr>
        @endforeach
        
        <!-- Summary -->
        <tr style="background-color: #F8F9FA;">
            <td colspan="2" style="font-weight: bold;">TOTAL BULAN</td>
            <td style="font-weight: bold;">{{ number_format($monthlyData->sum('total_transactions')) }}</td>
            <td style="font-weight: bold;">{{ number_format($monthlyData->sum('total_revenue')) }}</td>
            <td style="font-weight: bold;">{{ number_format($monthlyData->avg('avg_transaction_value')) }}</td>
        </tr>
    </tbody>
</table>