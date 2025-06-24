<?php

namespace App\Exports\Sheets;

use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

abstract class BaseSheet implements WithStyles, ShouldAutoSize
{
    protected function getBaseStyles(): array
    {
        return [
            // Header row styles
            1 => [
                'font' => [
                    'bold' => true,
                    'size' => 12,
                    'color' => ['rgb' => 'FFFFFF'],
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => $this->getHeaderColor()],
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER,
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => '000000'],
                    ],
                ],
            ],
        ];
    }

    protected function getHeaderColor(): string
    {
        return '4472C4'; // Default blue
    }

    public function styles(Worksheet $sheet)
    {
        $styles = $this->getBaseStyles();
        
        // Apply zebra striping to data rows
        $highestRow = $sheet->getHighestRow();
        if ($highestRow > 1) {
            $highestColumn = $sheet->getHighestColumn();
            
            // Data rows border
            $sheet->getStyle("A2:{$highestColumn}{$highestRow}")->applyFromArray([
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => 'CCCCCC'],
                    ],
                ],
                'alignment' => [
                    'vertical' => Alignment::VERTICAL_CENTER,
                ],
            ]);

            // Zebra striping
            for ($i = 3; $i <= $highestRow; $i += 2) {
                $sheet->getStyle("A{$i}:{$highestColumn}{$i}")->applyFromArray([
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => 'F8F9FA'],
                    ],
                ]);
            }
        }

        return $styles;
    }
}