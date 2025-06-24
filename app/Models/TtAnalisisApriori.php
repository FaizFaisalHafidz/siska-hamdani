<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class TtAnalisisApriori extends Model
{
    use HasFactory;

    protected $table = 'tt_analisis_apriori';

    protected $fillable = [
        'kumpulan_item',
        'nama_produk', // Add this to fillable
        'nilai_support',
        'nilai_confidence',
        'nilai_lift',
        'jumlah_transaksi',
        'total_transaksi_periode',
        'tanggal_analisis',
        'periode_awal',
        'periode_akhir',
        'jenis_analisis',
        'deskripsi_hasil',
    ];

    protected $casts = [
        'kumpulan_item' => 'array',
        'nilai_support' => 'decimal:4',
        'nilai_confidence' => 'decimal:4',
        'nilai_lift' => 'decimal:4',
        'tanggal_analisis' => 'datetime',
        'periode_awal' => 'date',
        'periode_akhir' => 'date',
    ];

    /**
     * Get nama produk attribute
     * Safely handle array/string conversion
     */
    public function getNamaProdukAttribute($value)
    {
        // If nama_produk is already set, return it
        if (!empty($value)) {
            return $value;
        }

        // If nama_produk is empty, try to build from kumpulan_item
        $items = $this->kumpulan_item;
        
        if (empty($items)) {
            return 'Unknown Product';
        }

        // Ensure items is an array
        if (is_string($items)) {
            $items = json_decode($items, true);
        }

        if (!is_array($items)) {
            return 'Unknown Product';
        }

        // Get product names from IDs
        $produkNames = [];
        foreach ($items as $itemId) {
            $produk = \App\Models\TmDataProduk::find($itemId);
            if ($produk) {
                $produkNames[] = $produk->nama_produk;
            } else {
                $produkNames[] = "Produk ID: {$itemId}";
            }
        }

        return implode(' + ', $produkNames);
    }

    /**
     * Get kumpulan item as array
     */
    public function getKumpulanItemArrayAttribute()
    {
        $items = $this->kumpulan_item;
        
        if (is_string($items)) {
            return json_decode($items, true) ?: [];
        }
        
        if (is_array($items)) {
            return $items;
        }
        
        return [];
    }

    /**
     * Get item count
     */
    public function getItemCountAttribute()
    {
        return count($this->kumpulan_item_array);
    }

    /**
     * Get formatted support percentage
     */
    public function getSupportPercentAttribute()
    {
        return round($this->nilai_support * 100, 2);
    }

    /**
     * Get formatted confidence percentage
     */
    public function getConfidencePercentAttribute()
    {
        return $this->nilai_confidence ? round($this->nilai_confidence * 100, 2) : null;
    }

    /**
     * Get strength level based on confidence and lift
     */
    public function getStrengthLevelAttribute()
    {
        if (!$this->nilai_confidence || !$this->nilai_lift) {
            return null;
        }

        $confidence = $this->nilai_confidence;
        $lift = $this->nilai_lift;

        if ($confidence >= 0.8 && $lift >= 2) return 'Very Strong';
        if ($confidence >= 0.6 && $lift >= 1.5) return 'Strong';
        if ($confidence >= 0.4 && $lift >= 1.2) return 'Medium';
        if ($confidence >= 0.2 && $lift >= 1) return 'Weak';
        return 'Very Weak';
    }

    /**
     * Scope for frequent itemsets
     */
    public function scopeFrequentItemsets($query)
    {
        return $query->where('jenis_analisis', 'frequent_itemset');
    }

    /**
     * Scope for association rules
     */
    public function scopeAssociationRules($query)
    {
        return $query->where('jenis_analisis', 'association_rule');
    }

    /**
     * Scope for period
     */
    public function scopePeriod($query, $startDate, $endDate)
    {
        return $query->whereBetween('periode_awal', [$startDate, $endDate]);
    }

    /**
     * Get related products from kumpulan_item
     */
    public function produkTerkait()
    {
        $itemIds = $this->kumpulan_item_array;
        
        if (empty($itemIds)) {
            return collect();
        }

        return \App\Models\TmDataProduk::whereIn('id', $itemIds)->get();
    }
}