{{-- filepath: /Users/flashcode/Desktop/REKAP DESKTOP/project-siska/resources/views/exports/laporan-overview.blade.php --}}
<table>
    <thead>
        <tr>
            <th colspan="4" style="background-color: #4472C4; color: white; font-weight: bold; font-size: 14px;">
                LAPORAN PENJUALAN OVERVIEW
            </th>
        </tr>
        <tr>
            <th colspan="4" style="background-color: #E7F3FF; font-style: italic;">
                Periode: {{ $statistics['periode'] }}
            </th>
        </tr>
        <tr></tr>
    </thead>
    <tbody>
        <!-- Statistics Section -->
        <tr>
            <td colspan="4" style="background-color: #F8F9FA; font-weight: bold;">RINGKASAN STATISTIK</td>
        </tr>
        <tr>
            <td style="font-weight: bold;">Total Pendapatan:</td>
            <td>{{ 'Rp ' . number_format($statistics['total_revenue'], 0, ',', '.') }}</td>
            <td style="font-weight: bold;">Total Transaksi:</td>
            <td>{{ number_format($statistics['total_transactions']) }}</td>
        </tr>
        <tr>
            <td style="font-weight: bold;">Total Item Terjual:</td>
            <td>{{ number_format($statistics['total_items']) }}</td>
            <td style="font-weight: bold;">Rata-rata per Transaksi:</td>
            <td>{{ 'Rp ' . number_format($statistics['avg_transaction_value'], 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td style="font-weight: bold;">Total Diskon:</td>
            <td>{{ 'Rp ' . number_format($statistics['total_discount'], 0, ',', '.') }}</td>
            <td style="font-weight: bold;">Total Pajak:</td>
            <td>{{ 'Rp ' . number_format($statistics['total_tax'], 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td style="font-weight: bold;">Unique Customers:</td>
            <td>{{ number_format($statistics['unique_customers']) }}</td>
            <td></td>
            <td></td>
        </tr>
        
        <tr></tr>
        
        <!-- Cashier Performance Section -->
        <tr>
            <td colspan="4" style="background-color: #F8F9FA; font-weight: bold;">PERFORMA KASIR</td>
        </tr>
        <tr>
            <th style="background-color: #E9ECEF;">Kasir</th>
            <th style="background-color: #E9ECEF;">Total Transaksi</th>
            <th style="background-color: #E9ECEF;">Total Pendapatan</th>
            <th style="background-color: #E9ECEF;">Rata-rata per Transaksi</th>
        </tr>
        @if(count($cashierPerformance) > 0)
            @foreach($cashierPerformance as $cashier)
            <tr>
                <td>{{ $cashier->kasir->name ?? 'Unknown' }}</td>
                <td>{{ number_format($cashier->total_transactions) }}</td>
                <td>{{ 'Rp ' . number_format($cashier->total_revenue, 0, ',', '.') }}</td>
                <td>{{ 'Rp ' . number_format($cashier->avg_transaction_value, 0, ',', '.') }}</td>
            </tr>
            @endforeach
        @else
            <tr>
                <td colspan="4" style="text-align: center; font-style: italic;">Tidak ada data kasir</td>
            </tr>
        @endif
        
        <tr></tr>
        
        <!-- Hourly Sales Pattern -->
        <tr>
            <td colspan="4" style="background-color: #F8F9FA; font-weight: bold;">POLA PENJUALAN PER JAM</td>
        </tr>
        <tr>
            <th style="background-color: #E9ECEF;">Jam</th>
            <th style="background-color: #E9ECEF;">Total Transaksi</th>
            <th style="background-color: #E9ECEF;">Total Pendapatan</th>
            <th style="background-color: #E9ECEF;">% dari Total</th>
        </tr>
        @if(count($hourlySales) > 0)
            @foreach($hourlySales as $hour)
            <tr>
                <td>{{ sprintf('%02d:00', $hour->hour) }}</td>
                <td>{{ number_format($hour->total_transactions) }}</td>
                <td>{{ 'Rp ' . number_format($hour->total_revenue, 0, ',', '.') }}</td>
                <td>{{ $statistics['total_revenue'] > 0 ? number_format(($hour->total_revenue / $statistics['total_revenue']) * 100, 1) : 0 }}%</td>
            </tr>
            @endforeach
        @else
            <tr>
                <td colspan="4" style="text-align: center; font-style: italic;">Tidak ada data penjualan per jam</td>
            </tr>
        @endif
        
        <tr></tr>
        
        <!-- Export Info -->
        <tr>
            <td colspan="4" style="font-style: italic; color: #666; font-size: 10px;">
                Laporan digenerate pada: {{ $statistics['generated_at'] }}
            </td>
        </tr>
    </tbody>
</table>