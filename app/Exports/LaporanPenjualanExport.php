<?php

namespace App\Exports;

use App\Exports\Sheets\LaporanOverviewSheet;
use App\Exports\Sheets\LaporanDailyTrendSheet;
use App\Exports\Sheets\LaporanTopProductsSheet;
use App\Exports\Sheets\LaporanTopCustomersSheet;
use App\Exports\Sheets\LaporanPaymentMethodSheet;
use App\Exports\Sheets\LaporanProductPerformanceSheet;
use App\Exports\Sheets\LaporanCustomerAnalysisSheet;
use App\Exports\Sheets\LaporanDailyDetailSheet;
use App\Exports\Sheets\LaporanMonthlyDetailSheet;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Carbon\Carbon;

class LaporanPenjualanExport implements WithMultipleSheets
{
    protected $reportType;
    protected $startDate;
    protected $endDate;
    protected $additionalData;

    public function __construct($reportType, $startDate, $endDate, $additionalData = [])
    {
        $this->reportType = $reportType;
        $this->startDate = $startDate;
        $this->endDate = $endDate;
        $this->additionalData = $additionalData;
    }

    public function sheets(): array
    {
        $sheets = [];

        switch ($this->reportType) {
            case 'overview':
                $sheets[] = new LaporanOverviewSheet($this->startDate, $this->endDate);
                $sheets[] = new LaporanDailyTrendSheet($this->startDate, $this->endDate);
                $sheets[] = new LaporanTopProductsSheet($this->startDate, $this->endDate);
                $sheets[] = new LaporanTopCustomersSheet($this->startDate, $this->endDate);
                $sheets[] = new LaporanPaymentMethodSheet($this->startDate, $this->endDate);
                break;

            case 'daily':
                $sheets[] = new LaporanDailyDetailSheet($this->startDate);
                break;

            case 'monthly':
                $sheets[] = new LaporanMonthlyDetailSheet($this->startDate);
                break;

            case 'product':
                $sheets[] = new LaporanProductPerformanceSheet($this->startDate, $this->endDate, $this->additionalData);
                break;

            case 'customer':
                $sheets[] = new LaporanCustomerAnalysisSheet($this->startDate, $this->endDate, $this->additionalData);
                break;

            case 'complete':
                $sheets[] = new LaporanOverviewSheet($this->startDate, $this->endDate);
                $sheets[] = new LaporanDailyTrendSheet($this->startDate, $this->endDate);
                $sheets[] = new LaporanTopProductsSheet($this->startDate, $this->endDate);
                $sheets[] = new LaporanTopCustomersSheet($this->startDate, $this->endDate);
                $sheets[] = new LaporanPaymentMethodSheet($this->startDate, $this->endDate);
                $sheets[] = new LaporanProductPerformanceSheet($this->startDate, $this->endDate, $this->additionalData);
                $sheets[] = new LaporanCustomerAnalysisSheet($this->startDate, $this->endDate, $this->additionalData);
                break;

            default:
                // Fallback to overview
                $sheets[] = new LaporanOverviewSheet($this->startDate, $this->endDate);
                break;
        }

        return $sheets;
    }
}