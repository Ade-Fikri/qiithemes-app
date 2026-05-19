import React, { useState } from 'react';
import { supabase } from '../../../utils/supabaseClient'; // 🌟 Pastikan path mundur 3 tingkat ke folder utils cocok
import { showSuccess, showError, showLoading } from '../../../utils/alerts';

const CustomerTab = ({ orders, setOrders }) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // LOGIC AMBIL DATA CUSTOMER
  const customers = orders.map((order, index) => ({
    no: index + 1,
    id: order.id,
    userName: order.userName,
    waNumber: order.waNumber,
    themeModel: order.themeModel,
    character: order.characterName || order.character || '-', // 🌟 Antisipasi pemetaan characterName dari Dashboard
    adminTarget: order.adminTarget
  }));

  // HANDLER CHECKBOX SATUAN
  const handleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // HANDLER CHECKBOX ALL
  const handleSelectAll = () => {
    if (selectedIds.length === customers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(customers.map(c => c.id));
    }
  };

  // 🔥 FIX LOGIC: HAPUS TEMBUS KE DATABASE SUPABASE
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0 || isDeleting) return;

    if (window.confirm(`Yakin mau hapus ${selectedIds.length} data order customer ini secara permanen dari database lee?`)) {
      try {
        setIsDeleting(true);
        showLoading(); // Picu animasi putaran loading antarmuka

        // 1. Eksekusi Hapus Massal di Tabel Supabase Orders berdasarkan deretan ID terpilih
        const { error } = await supabase
          .from('orders')
          .delete()
          .in('id', selectedIds);

        if (error) throw error;

        // 2. Jika Database Sukses Merespon, Sinkronkan State Utama di Dashboard Kakek
        const remainingOrders = orders.filter(o => !selectedIds.includes(o.id));
        setOrders(remainingOrders);
        
        // 3. Reset Kotak Centang State Lokal Cucu
        setSelectedIds([]);
        showSuccess("Data order customer terpilih berhasil dimusnahkan lee!");

      } catch (error) {
        console.error("Gagal mendelete database customer:", error);
        showError("Gagal menghapus data dari server, periksa aturan RLS tabel orders lu lee.");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // AKSI 2: EXPORT TO EXCEL (.CSV)
  const handleExportExcel = () => {
    if (customers.length === 0) return;

    const dataToExport = selectedIds.length > 0 
      ? customers.filter(c => selectedIds.includes(c.id))
      : customers;

    const today = new Date().toLocaleDateString('id-ID', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    let csvContent = "\uFEFF";
    csvContent += `LAPORAN DATA CUSTOMER QIITHEMES\n`;
    csvContent += `Tanggal Export: ${today}\n\n`;
    csvContent += `No,Nama Customer,Nomor WA,Model Tema,Karakter,Admin Target\n`;

    dataToExport.forEach(c => {
      csvContent += `${c.no},"${c.userName}","${c.waNumber}","${c.themeModel}","${c.character}","${c.adminTarget}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Data_Customer_QiiThemes_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="px-2 font-['Inter']">
      
      {/* STICKY TOP ACTION BAR */}
      <div className={`sticky top-0 z-40 p-4 rounded-[24px] border transition-all duration-300 mb-4 flex justify-between items-center ${
        selectedIds.length > 0 
          ? 'bg-[#0f172a] text-white border-transparent shadow-lg' 
          : 'bg-white text-[#0f172a] border-slate-100 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <input 
            type="checkbox" 
            checked={customers.length > 0 && selectedIds.length === customers.length}
            onChange={handleSelectAll}
            disabled={isDeleting}
            className="w-5 h-5 rounded-[6px] border-slate-300 text-[#2557e0] focus:ring-[#2557e0]"
          />
          <div>
            <span className="text-[12px] font-black uppercase tracking-wider block">
              {selectedIds.length > 0 ? `${selectedIds.length} Terpilih` : 'Pilih Semua'}
            </span>
            <span className="text-[10px] font-bold block text-slate-400">
              {customers.length} Total Database
            </span>
          </div>
        </div>

        {/* AKSI DINAMIS */}
        <div className="flex gap-2">
          {selectedIds.length > 0 ? (
            <>
              <button 
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className={`text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-xl active:scale-95 transition-transform ${
                  isDeleting ? 'bg-slate-700 text-slate-400' : 'bg-red-500/20 text-red-400'
                }`}
              >
                {isDeleting ? 'Menghapus...' : 'Hapus'}
              </button>
              <button 
                onClick={handleExportExcel}
                disabled={isDeleting}
                className="bg-[#2557e0] text-white text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-xl active:scale-95 transition-transform disabled:opacity-50"
              >
                Export
              </button>
            </>
          ) : (
            <button 
              onClick={handleExportExcel}
              className="bg-slate-100 hover:bg-slate-200 text-[#0f172a] text-[11px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all active:scale-95"
            >
              Export Semua
            </button>
          )}
        </div>
      </div>

      {/* DAFTAR CARD CUSTOMER */}
      <div className="space-y-3">
        {customers.length > 0 ? (
          customers.map((c) => {
            const isChecked = selectedIds.includes(c.id);
            return (
              <div 
                key={c.id} 
                onClick={() => !isDeleting && handleSelectOne(c.id)}
                className={`p-5 rounded-[30px] border transition-all duration-200 relative bg-white cursor-pointer select-none ${
                  isChecked 
                    ? 'border-[#2557e0] shadow-md shadow-blue-50 bg-blue-50/10' 
                    : 'border-slate-100 shadow-sm hover:border-slate-200'
                } ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2.5 py-1 rounded-md font-black">
                    #{c.no}
                  </span>
                  
                  <input 
                    type="checkbox" 
                    checked={isChecked}
                    disabled={isDeleting}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleSelectOne(c.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-5 h-5 rounded-[6px] border-slate-300 text-[#2557e0] focus:ring-[#2557e0]"
                  />
                </div>

                <div className="mb-4">
                  <h4 className="font-black text-[#0f172a] text-[16px] leading-snug">{c.userName}</h4>
                  <a 
                    href={`https://wa.me/${c.waNumber}`} 
                    target="_blank" 
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[#2557e0] font-bold text-[12px] mt-1 inline-flex items-center gap-1 hover:underline"
                  >
                    +{c.waNumber}
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-50 text-[12px]">
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Model Tema</p>
                    <p className="font-bold text-slate-700 mt-0.5">{c.themeModel}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Karakter</p>
                    <p className="font-medium text-slate-600 italic mt-0.5">{c.character}</p>
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <span className="bg-slate-50 text-slate-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-slate-100">
                    PIC: {c.adminTarget.replace('Admin ', '')}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white p-10 rounded-[30px] border border-slate-100 text-center text-slate-400 italic text-sm shadow-sm">
            Belum ada database customer lee...
          </div>
        )}
      </div>

    </div>
  );
};

export default CustomerTab;
