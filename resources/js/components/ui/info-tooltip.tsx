import { cn } from "@/lib/utils"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { HelpCircle, X } from "lucide-react"
import * as React from "react"

interface InfoTooltipProps {
  content: React.ReactNode
  title?: string
  side?: "top" | "right" | "bottom" | "left"
  className?: string
  iconSize?: "sm" | "md" | "lg"
  variant?: "default" | "primary" | "success" | "warning" | "danger"
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "full"
  align?: "start" | "center" | "end"
  scrollable?: boolean
  maxHeight?: string
}

export function InfoTooltip({
  content,
  title,
  side = "top",
  className,
  iconSize = "sm",
  variant = "default",
  maxWidth = "md",
  align = "center",
  scrollable = true,
  maxHeight = "70vh"
}: InfoTooltipProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const iconSizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4", 
    lg: "h-5 w-5"
  }

  const variantClasses = {
    default: "text-gray-500 hover:text-gray-700",
    primary: "text-blue-500 hover:text-blue-700",
    success: "text-green-500 hover:text-green-700",
    warning: "text-yellow-500 hover:text-yellow-700",
    danger: "text-red-500 hover:text-red-700"
  }

  const maxWidthClasses = {
    xs: "w-72",
    sm: "w-80",
    md: "w-96",
    lg: "w-[28rem]",
    xl: "w-[32rem]",
    "2xl": "w-[36rem]",
    full: "w-[95vw] max-w-lg"
  }

  // Debug: Log props untuk troubleshooting
  React.useEffect(() => {
    console.log('InfoTooltip Props:', { title, content, scrollable, maxWidth })
  }, [title, content, scrollable, maxWidth])

  // Mobile: Use full-screen modal approach for large content
  if (isMobile && scrollable) {
    return (
      <TooltipPrimitive.Provider delayDuration={300}>
        <TooltipPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
          <TooltipPrimitive.Trigger asChild>
            <button 
              type="button"
              onClick={() => setIsOpen(true)}
              className={cn(
                "inline-flex items-center justify-center transition-colors cursor-help focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-full",
                variantClasses[variant],
                className
              )}
            >
              <HelpCircle className={iconSizeClasses[iconSize]} />
            </button>
          </TooltipPrimitive.Trigger>
          
          {isOpen && (
            <TooltipPrimitive.Portal>
              <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
                <div className="fixed inset-x-4 top-4 bottom-4 bg-white rounded-lg shadow-2xl flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900 text-lg">{title || "Informasi"}</h3>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <X className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>
                  
                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="text-gray-700 text-sm leading-relaxed">
                      {content}
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="border-t border-gray-200 p-4">
                    <button
                      onClick={() => setIsOpen(false)}
                      className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              </div>
            </TooltipPrimitive.Portal>
          )}
        </TooltipPrimitive.Root>
      </TooltipPrimitive.Provider>
    )
  }

  // Desktop: Enhanced tooltip with scroll
  return (
    <TooltipPrimitive.Provider delayDuration={300}>
      <TooltipPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
        <TooltipPrimitive.Trigger asChild>
          <button 
            type="button"
            className={cn(
              "inline-flex items-center justify-center transition-colors cursor-help focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-full",
              variantClasses[variant],
              className
            )}
          >
            <HelpCircle className={iconSizeClasses[iconSize]} />
          </button>
        </TooltipPrimitive.Trigger>
        
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            align={align}
            sideOffset={8}
            alignOffset={0}
            collisionPadding={20}
            avoidCollisions={true}
            className={cn(
              "z-50 rounded-lg border border-gray-200 bg-white shadow-2xl",
              "animate-in fade-in-0 zoom-in-95 duration-200",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
              "data-[side=bottom]:slide-in-from-top-2",
              "data-[side=left]:slide-in-from-right-2", 
              "data-[side=right]:slide-in-from-left-2",
              "data-[side=top]:slide-in-from-bottom-2",
              maxWidthClasses[maxWidth]
            )}
          >
            {/* Header - Fixed */}
            {title && (
              <div className="border-b border-gray-100 p-4 bg-gray-50 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-full hover:bg-gray-200 transition-colors ml-2"
                  >
                    <X className="h-3 w-3 text-gray-500" />
                  </button>
                </div>
              </div>
            )}
            
            {/* Scrollable Content */}
            <div 
              className={cn(
                "overflow-y-auto overflow-x-hidden",
                scrollable && "max-h-[60vh] md:max-h-[50vh]",
                "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
              )}
              style={scrollable ? { maxHeight: maxHeight } : {}}
            >
              <div className="p-4">
                <div className="text-gray-700 text-sm leading-relaxed">
                  {content}
                </div>
              </div>
            </div>
            
            <TooltipPrimitive.Arrow 
              className="fill-white stroke-gray-200 stroke-1" 
              width={11} 
              height={5} 
            />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

interface AprioriInfoProps {
  type: 'support' | 'confidence' | 'lift' | 'frequent_itemset' | 'association_rule' | 'apriori_algorithm' | 'strength_level' | 'frekuensi_bersamaan'
  side?: "top" | "right" | "bottom" | "left"
  variant?: "default" | "primary" | "success" | "warning" | "danger"
  align?: "start" | "center" | "end"
}

export function AprioriInfo({ 
  type, 
  side = "top", 
  variant = "primary", 
  align = "center" 
}: AprioriInfoProps) {
  
  // Debug: Log untuk troubleshooting
  React.useEffect(() => {
    console.log('AprioriInfo type:', type)
  }, [type])

  const getContent = () => {
    switch (type) {
      case 'frekuensi_bersamaan':
        return {
          title: "Frekuensi Bersamaan",
          maxWidth: "lg" as const,
          scrollable: true,
          content: (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h5 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  📊 Definisi
                </h5>
                <p className="text-blue-800 leading-relaxed">
                  Frekuensi bersamaan adalah jumlah transaksi dimana kedua produk atau lebih dibeli bersamaan 
                  dalam periode waktu tertentu.
                </p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h5 className="font-semibold text-green-900 mb-3">🔍 Cara Menghitung</h5>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded border-l-4 border-green-400">
                    <p className="font-medium text-green-800 mb-2">Langkah 1: Identifikasi Transaksi</p>
                    <p className="text-green-700 text-sm">
                      Scan semua transaksi dan cari yang mengandung kombinasi produk tertentu
                    </p>
                  </div>
                  
                  <div className="bg-white p-3 rounded border-l-4 border-green-400">
                    <p className="font-medium text-green-800 mb-2">Langkah 2: Hitung Kemunculan</p>
                    <p className="text-green-700 text-sm">
                      Jumlahkan berapa kali kombinasi produk muncul dalam transaksi yang sama
                    </p>
                  </div>
                  
                  <div className="bg-white p-3 rounded border-l-4 border-green-400">
                    <p className="font-medium text-green-800 mb-2">Langkah 3: Validasi Minimum</p>
                    <p className="text-green-700 text-sm">
                      Pastikan frekuensi ≥ threshold minimum (biasanya 2-5 transaksi)
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h5 className="font-semibold text-yellow-900 mb-3">💼 Contoh Praktis</h5>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded border">
                    <p className="font-medium text-yellow-800 mb-2">Data Transaksi:</p>
                    <div className="text-yellow-700 text-sm space-y-1 font-mono">
                      <p>Transaksi #001: [Roti, Susu, Mentega, Kopi] ✓</p>
                      <p>Transaksi #002: [Roti, Susu, Selai] ✓</p>
                      <p>Transaksi #003: [Roti, Kopi, Gula] ✗</p>
                      <p>Transaksi #004: [Susu, Keju, Yogurt] ✗</p>
                      <p>Transaksi #005: [Roti, Susu, Coklat] ✓</p>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-100 p-3 rounded border-l-4 border-yellow-500">
                    <p className="font-medium text-yellow-800 mb-1">Hasil Perhitungan:</p>
                    <p className="text-yellow-700 text-sm">
                      Frekuensi bersamaan (Roti + Susu) = <strong>3 transaksi</strong>
                      <br />
                      <span className="text-xs italic">
                        Dari 5 total transaksi, 3 mengandung kedua produk
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h5 className="font-semibold text-purple-900 mb-3">📈 Interpretasi Nilai</h5>
                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-white p-3 rounded border-l-4 border-green-500">
                    <p className="font-medium text-green-800">Frekuensi Tinggi (≥10)</p>
                    <p className="text-green-700 text-sm">
                      Produk sangat sering dibeli bersamaan, hubungan kuat, cocok untuk bundling
                    </p>
                  </div>
                  
                  <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                    <p className="font-medium text-blue-800">Frekuensi Sedang (5-9)</p>
                    <p className="text-blue-700 text-sm">
                      Produk cukup sering dibeli bersamaan, layak untuk rekomendasi
                    </p>
                  </div>
                  
                  <div className="bg-white p-3 rounded border-l-4 border-yellow-500">
                    <p className="font-medium text-yellow-800">Frekuensi Rendah (2-4)</p>
                    <p className="text-yellow-700 text-sm">
                      Produk kadang dibeli bersamaan, perlu analisis lebih lanjut
                    </p>
                  </div>
                  
                  <div className="bg-white p-3 rounded border-l-4 border-red-500">
                    <p className="font-medium text-red-800">Frekuensi Sangat Rendah (0-1)</p>
                    <p className="text-red-700 text-sm">
                      Produk jarang/tidak pernah dibeli bersamaan, tidak ada hubungan
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        };

      case 'support':
        return {
          title: "Support",
          maxWidth: "lg" as const,
          scrollable: true,
          content: (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h5 className="font-semibold text-blue-900 mb-2">📋 Definisi Support</h5>
                <p className="text-blue-800 leading-relaxed">
                  Support mengukur seberapa sering itemset muncul dalam database transaksi. 
                  Ini adalah metrik fundamental dalam analisis market basket.
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-200">
                <h5 className="font-semibold text-indigo-900 mb-3">🧮 Formula Perhitungan</h5>
                <div className="bg-white p-4 rounded border shadow-sm">
                  <div className="text-center space-y-2">
                    <p className="font-mono text-lg text-indigo-800 font-bold">
                      Support(A) = Transaksi mengandung A / Total transaksi
                    </p>
                    <p className="text-indigo-700 text-sm">
                      Hasil: Desimal (0.0 - 1.0) atau Persentase (0% - 100%)
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h5 className="font-semibold text-green-900 mb-3">💡 Contoh Perhitungan</h5>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded border">
                    <p className="font-medium text-green-800 mb-2">Scenario Toko</p>
                    <div className="text-green-700 text-sm space-y-1">
                      <p>• Total transaksi: <strong>1,000</strong></p>
                      <p>• Transaksi dengan "Roti": <strong>200</strong></p>
                      <p>• Support(Roti) = 200/1000 = 20%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        };

      case 'confidence':
        return {
          title: "Confidence",
          maxWidth: "lg" as const,
          scrollable: true,
          content: (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h5 className="font-semibold text-blue-900 mb-2">🎯 Definisi Confidence</h5>
                <p className="text-blue-800 leading-relaxed">
                  Confidence mengukur akurasi rule: "Jika membeli A, seberapa besar kemungkinan juga membeli B?"
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-200">
                <h5 className="font-semibold text-indigo-900 mb-3">🧮 Formula</h5>
                <div className="bg-white p-4 rounded border shadow-sm">
                  <p className="font-mono text-lg text-indigo-800 font-bold text-center">
                    Confidence(A→B) = Support(A,B) / Support(A)
                  </p>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h5 className="font-semibold text-green-900 mb-3">📊 Contoh</h5>
                <div className="bg-white p-3 rounded border">
                  <p className="text-green-700 text-sm">
                    Jika 80% orang yang membeli roti juga membeli susu, 
                    maka confidence = 80% (sangat akurat)
                  </p>
                </div>
              </div>
            </div>
          )
        };

      case 'lift':
        return {
          title: "Lift Ratio",
          maxWidth: "lg" as const,
          scrollable: true,
          content: (
            <div className="space-y-3">
              <p>Lift mengukur seberapa kuat hubungan antara item A dan B dibandingkan jika mereka independen.</p>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-1">Rumus:</h5>
                <p className="text-blue-800 font-mono text-sm">
                  Lift(A→B) = Confidence(A→B) / Support(B)
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="bg-green-50 p-2 rounded border-l-4 border-green-400">
                  <p className="text-green-800 text-sm">
                    <strong>Lift &gt; 1:</strong> Item B lebih sering dibeli bersama A
                  </p>
                </div>
                <div className="bg-gray-50 p-2 rounded border-l-4 border-gray-400">
                  <p className="text-gray-800 text-sm">
                    <strong>Lift = 1:</strong> Item A dan B independen
                  </p>
                </div>
                <div className="bg-red-50 p-2 rounded border-l-4 border-red-400">
                  <p className="text-red-800 text-sm">
                    <strong>Lift &lt; 1:</strong> Item B jarang dibeli bersama A
                  </p>
                </div>
              </div>
            </div>
          )
        };

      case 'frequent_itemset':
        return {
          title: "Frequent Itemset",
          maxWidth: "lg" as const,
          scrollable: true,
          content: (
            <div className="space-y-3">
              <p>Frequent Itemset adalah kombinasi item yang muncul bersama dalam transaksi dengan frekuensi ≥ minimum support.</p>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-2">Cara Kerja:</h5>
                <div className="text-blue-800 text-sm space-y-1">
                  <p>1. Hitung support untuk setiap kombinasi item</p>
                  <p>2. Filter yang memenuhi minimum support threshold</p>
                  <p>3. Hasil = frequent itemsets</p>
                </div>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg">
                <h5 className="font-medium text-green-900 mb-1">Contoh:</h5>
                <p className="text-green-800 text-sm">
                  Jika minimum support = 10%, maka {"{Roti, Susu}"} adalah frequent itemset 
                  ketika kombinasi ini muncul di ≥10% dari semua transaksi.
                </p>
              </div>
            </div>
          )
        };

      case 'association_rule':
        return {
          title: "Association Rule",
          maxWidth: "lg" as const,
          scrollable: true,
          content: (
            <div className="space-y-3">
              <p>Association Rule menunjukkan hubungan "jika-maka" antara item dalam bentuk A → B.</p>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-1">Format Rule:</h5>
                <p className="text-blue-800 font-mono text-sm">
                  Antecedent (IF) → Consequent (THEN)
                </p>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg">
                <h5 className="font-medium text-green-900 mb-1">Contoh Praktis:</h5>
                <p className="text-green-800 text-sm">
                  "Jika pelanggan membeli Roti → maka akan membeli Susu"
                </p>
              </div>
            </div>
          )
        };

      case 'apriori_algorithm':
        return {
          title: "Algoritma Apriori",
          maxWidth: "xl" as const,
          scrollable: true,
          content: (
            <div className="space-y-4">
              <p>Algoritma Apriori adalah metode data mining untuk menemukan pola pembelian dan menghasilkan rekomendasi produk.</p>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-3">Langkah-langkah:</h5>
                <div className="text-blue-800 text-sm space-y-2">
                  <p>1. Scan Database: Hitung support untuk setiap item</p>
                  <p>2. Generate Frequent Itemsets: Filter item dengan support ≥ threshold</p>
                  <p>3. Create Association Rules: Generate rules dari frequent itemsets</p>
                  <p>4. Filter by Confidence: Ambil rules dengan confidence tinggi</p>
                  <p>5. Calculate Lift: Validasi kekuatan hubungan</p>
                </div>
              </div>
            </div>
          )
        };

      case 'strength_level':
        return {
          title: "Strength Level",
          maxWidth: "xl" as const,
          scrollable: true,
          content: (
            <div className="space-y-3">
              <p>Tingkat kekuatan hubungan antar produk berdasarkan nilai confidence dan lift:</p>
              
              <div className="space-y-2">
                <div className="bg-green-50 p-3 rounded border-l-4 border-green-500">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-green-800">VERY STRONG</span>
                    <span className="text-green-700 text-sm">Confidence ≥ 80% &amp; Lift ≥ 2.0</span>
                  </div>
                  <p className="text-green-800 text-xs">Hubungan sangat kuat, rekomendasi sangat akurat</p>
                </div>
                
                <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-500">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-blue-800">STRONG</span>
                    <span className="text-blue-700 text-sm">Confidence ≥ 60% &amp; Lift ≥ 1.5</span>
                  </div>
                  <p className="text-blue-800 text-xs">Hubungan kuat, rekomendasi dapat diandalkan</p>
                </div>
                
                <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-500">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-yellow-800">MEDIUM</span>
                    <span className="text-yellow-700 text-sm">Confidence ≥ 40% &amp; Lift ≥ 1.2</span>
                  </div>
                  <p className="text-yellow-800 text-xs">Hubungan sedang, rekomendasi cukup baik</p>
                </div>
                
                <div className="bg-orange-50 p-3 rounded border-l-4 border-orange-500">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-orange-800">WEAK</span>
                    <span className="text-orange-700 text-sm">Confidence ≥ 20% &amp; Lift ≥ 1.0</span>
                  </div>
                  <p className="text-orange-800 text-xs">Hubungan lemah, perlu evaluasi lebih lanjut</p>
                </div>
                
                <div className="bg-red-50 p-3 rounded border-l-4 border-red-500">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-red-800">VERY WEAK</span>
                    <span className="text-red-700 text-sm">Confidence &lt; 20% atau Lift &lt; 1.0</span>
                  </div>
                  <p className="text-red-800 text-xs">Hubungan sangat lemah, tidak direkomendasikan</p>
                </div>
              </div>
            </div>
          )
        };

      default:
        console.log('Default case hit for type:', type)
        return {
          title: "Informasi",
          maxWidth: "sm" as const,
          scrollable: false,
          content: "Klik untuk informasi lebih lanjut."
        };
    }
  };

  const { title, content, maxWidth, scrollable } = getContent();
  
  return (
    <InfoTooltip 
      title={title}
      content={content}
      side={side}
      variant={variant}
      maxWidth={maxWidth}
      align={align}
      scrollable={scrollable}
    />
  );
}