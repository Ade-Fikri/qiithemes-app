import React from 'react';

const StatsTab = ({ orders, filterName }) => {
  
  // 1. Helper konversi format harga string ke angka murni ('15k' -> 15000)
  const parsePrice = (priceStr) => {
    if (!priceStr) return 0;
    const cleanStr = priceStr.toLowerCase().replace(/[^0-9k]/g, '');
    if (cleanStr.includes('k')) {
      return (parseFloat(cleanStr.replace('k', '')) || 0) * 1000;
    }
    return parseInt(cleanStr) || 0;
  };

  // 2. Filter data orderan secara real-time berdasarkan slider admin di atas
  const activeOrders = filterName === 'All' 
    ? orders 
    : orders.filter(o => o.adminTarget?.toLowerCase().trim() === filterName?.toLowerCase().trim());

  // 3. Kalkulasi metrik dasar
  const totalOrdersCount = activeOrders.length;
  const pendingCount = activeOrders.filter(o => o.status === 'pending').length;
  const prosesCount = activeOrders.filter(o => o.status === 'proses').length;
  const suksesCount = activeOrders.filter(o => o.status === 'sukses' || o.status === 'done').length;

  // Hitung Omset Kotor (Hanya dari orderan yang berstatus 'sukses' / 'done')
  const totalRevenue = activeOrders
    .filter(o => o.status === 'sukses' || o.status === 'done')
    .reduce((sum, o) => sum + parsePrice(o.price), 0);

  // Format ke Rupiah standar Indonesia
  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  // Persentase sukses untuk progress bar distribusi status
  const successRate = totalOrdersCount > 0 ? Math.round((suksesCount / totalOrdersCount) * 100) : 0;

  return (
    <div className="space-y-5 px-2 animate-fade-in pb-12 font-['Inter']">
      
      {/* 🏙️ HEADER METRIK JUDUL */}
      <div className="flex flex-col mb-2">
        <h2 className="text-xl font-black text-[#0f172a] tracking-tight">
          {filterName === 'All' ? 'Ringkasan Global' : `Kinerja ${filterName.replace('Admin ', '')}`}
        </h2>
        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
          Data kalkulasi metrik akumulasi orderan real-time dari Supabase.
        </p>
      </div>

      {/* 💰 CARD UTAMA: OMSET KOTOR (Full Width) */}
      <div className="bg-[#0f172a] p-6 rounded-[32px] text-white shadow-xl shadow-blue-900/10 relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl"></div>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1.5">
          TOTAL OMSET (DONE)
        </p>
        <h3 className="text-2xl font-black tracking-tight text-white">
          {formatRupiah(totalRevenue)}
        </h3>
        <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-[11px] text-slate-400">
          <span>Tingkat Penyelesaian</span>
          <span className="font-bold text-emerald-400">{successRate}% Selesai</span>
        </div>
      </div>

      {/* 📊 GRID METRIK OPERASIONAL (Dua Kolom) */}
      <div className="grid grid-cols-2 gap-4">
        {/* Card Total Orderan */}
        <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mb-1">
              TOTAL ORDER
            </p>
            <h4 className="text-xl font-black text-[#0f172a]">{totalOrdersCount}</h4>
          </div>
          <p className="text-[10px] text-slate-400 font-medium mt-3">Pesanan masuk</p>
        </div>

        {/* Card Antrean Aktif */}
        <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mb-1">
              ANTREAN AKTIF
            </p>
            <h4 className="text-xl font-black text-amber-500">{pendingCount + prosesCount}</h4>
          </div>
          <div className="flex gap-2 text-[9px] font-bold mt-3 text-slate-400">
            <span className="text-orange-500">{pendingCount} Pnd</span>
            <span>•</span>
            <span className="text-blue-500">{prosesCount} Prs</span>
          </div>
        </div>
      </div>

      {/* 📊 PROGRESS BAR DISTRIBUSI STATUS PESANAN */}
      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-5">
        <h3 className="text-[11px] font-black text-[#0f172a] uppercase tracking-wider">
          Distribusi Status Pesanan
        </h3>

        <div className="space-y-4">
          {/* Bar Sukses */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-slate-500">Selesai (Sukses)</span>
              <span className="text-[#0f172a] font-black">{suksesCount} Order</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                style={{ width: `${totalOrdersCount > 0 ? (suksesCount / totalOrdersCount) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          {/* Bar Proses */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-slate-500">Sedang Diproses</span>
              <span className="text-[#0f172a] font-black">{prosesCount} Order</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                style={{ width: `${totalOrdersCount > 0 ? (prosesCount / totalOrdersCount) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          {/* Bar Pending */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-slate-500">Menunggu (Pending)</span>
              <span className="text-[#0f172a] font-black">{pendingCount} Order</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-orange-400 rounded-full transition-all duration-500" 
                style={{ width: `${totalOrdersCount > 0 ? (pendingCount / totalOrdersCount) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default StatsTab;
