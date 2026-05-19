import React, { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabaseClient';
import { showError, showSuccess, showLoading } from '../../../utils/alerts';

const ArchiveTab = ({ admins }) => {
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [archivedOrders, setArchivedOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch daftar bulan yang memiliki data arsip secara unik
  useEffect(() => {
    const fetchAvailableMonths = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('created_at')
          .eq('is_archived', true);

        if (error) throw error;

        const months = data.map(item => {
          const date = new Date(item.created_at);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        });
        const uniqueMonths = [...new Set(months)].sort().reverse();
        
        setAvailableMonths(uniqueMonths);
        if (uniqueMonths.length > 0) {
          setSelectedMonth(uniqueMonths[0]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchAvailableMonths();
  }, []);

  // Fetch data pesanan berdasarkan bulan terarsip yang dipilih
  useEffect(() => {
    if (!selectedMonth) return;

    const fetchArchivedDataByMonth = async () => {
      try {
        setLoading(true);
        const [year, month] = selectedMonth.split('-');
        
        const startOfMonth = new Date(year, month - 1, 1).toISOString();
        const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

        const { data, error } = await supabase
          .from('orders')
          .select(`
            id, customer_name, character_name, whatsapp_number,
            theme_title, theme_price, status, created_at,
            users (name)
          `)
          .eq('is_archived', true)
          .gte('created_at', startOfMonth)
          .lte('created_at', endOfMonth)
          .order('id', { ascending: false });

        if (error) throw error;

        const formatted = (data || []).map(o => ({
          id: o.id,
          userName: o.customer_name,
          characterName: o.character_name,
          waNumber: o.whatsapp_number,
          themeModel: o.theme_title,
          price: o.theme_price,
          status: o.status,
          created_at: o.created_at,
          adminTarget: o.users?.name || 'Unassigned'
        }));

        setArchivedOrders(formatted);
      } catch (err) {
        console.error(err);
        showError("Gagal memuat data arsip lee.");
      } finally {
        setLoading(false);
      }
    };

    fetchArchivedDataByMonth();
  }, [selectedMonth]);

  const handleReExport = () => {
    if (archivedOrders.length === 0) return;
    try {
      showLoading();
      let csvContent = `=== DATA ARSIP REKAP OMSET GLOBAL TOKO PERIODE ${selectedMonth} ===\n`;
      csvContent += "ID Order,Nama Customer,Karakter,No WA,Model Tema,Harga,Status,Admin PJ\n";
      
      archivedOrders.forEach(o => {
        csvContent += `${o.id},"${o.userName.replace(/"/g, '""')}",` +
                      `"${(o.characterName || '-').replace(/"/g, '""')}",` +
                      `"${o.waNumber}","${o.themeModel}","${o.price}",${o.status},"${o.adminTarget}"\n`;
      });
      csvContent += "\n\n";

      admins.forEach(admin => {
        const staffOrders = archivedOrders.filter(o => o.adminTarget.toLowerCase().trim() === admin.name.toLowerCase().trim());
        csvContent += `=== ARSIP DATA REKAP LAPORAN: ${admin.name.toUpperCase()} ===\n`;
        csvContent += "ID Order,Nama Customer,Karakter,No WA,Model Tema,Harga,Status\n";
        
        if (staffOrders.length > 0) {
          staffOrders.forEach(o => {
            csvContent += `${o.id},"${o.userName.replace(/"/g, '""')}",` +
                          `"${(o.characterName || '-').replace(/"/g, '""')}",` +
                          `"${o.waNumber}","${o.themeModel}","${o.price}",${o.status}\n`;
          });
        } else {
          csvContent += "-,Tidak ada kontribusi orderan sukses,-,-,-,-,-\n";
        }
        csvContent += "\n";
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `RE_EXPORT_ARSIP_CLOSING_${selectedMonth}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showSuccess("File arsip lama berhasil di-export ulang lee!");
    } catch (err) {
      showError("Gagal memproses re-export berkas lama.");
    }
  };

  const totalOmsetArsip = archivedOrders.reduce((acc, curr) => {
    const angka = parseInt(curr.price.replace(/[^0-9]/g, '')) || 0;
    return acc + angka;
  }, 0);

  return (
    <div className="space-y-4 px-2 animate-fade-in pb-12">
      <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="flex-1">
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mb-1.5 px-1">
            PILIH PERIODE SIKLUS BUKU
          </p>
          {availableMonths.length > 0 ? (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-bold text-[#0f172a] outline-none focus:border-blue-500/50"
            >
              {availableMonths.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          ) : (
            <div className="text-xs font-bold text-slate-400 p-3 bg-slate-50 rounded-xl italic">
              Belum ada riwayat siklus buku lee.
            </div>
          )}
        </div>

        {archivedOrders.length > 0 && (
          <button
            onClick={handleReExport}
            className="bg-blue-50 text-blue-600 border border-blue-100 p-3 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-blue-100 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            🔄 Re-Export CSV
          </button>
        )}
      </div>

      {archivedOrders.length > 0 && (
        <div className="bg-[#0f172a] text-white p-5 rounded-[28px] shadow-md flex justify-between items-center">
          <div>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Total Omset Bersih</p>
            <h3 className="text-base font-black tracking-tight mt-0.5 text-emerald-400">
              Rp {totalOmsetArsip.toLocaleString('id-ID')}
            </h3>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Total Pesanan</p>
            <h3 className="text-base font-black tracking-tight mt-0.5 text-blue-400">
              {archivedOrders.length} Order
            </h3>
          </div>
        </div>
      )}

      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider px-1">Daftar Arsip Pesanan</h4>
        {loading ? (
          <div className="text-center py-12 text-xs font-bold text-slate-400 animate-pulse">
            MENARIK ARSIP DATA BULAN LALU LEE...
          </div>
        ) : archivedOrders.length > 0 ? (
          archivedOrders.map((order) => (
            <div key={order.id} className="bg-white p-5 rounded-[26px] border border-slate-100 shadow-sm opacity-85">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-[#0f172a] text-sm">{order.userName}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">PJ: {order.adminTarget}</p>
                  <p className="text-[11px] text-slate-500 italic mt-1">Model: {order.themeModel} ({order.price})</p>
                </div>
                <span className="text-[9px] px-2.5 py-1 rounded-md font-black uppercase tracking-wider bg-slate-100 text-slate-500">
                  {order.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-slate-400 italic text-xs py-12 bg-white rounded-[26px] border border-slate-100 px-4">
            Tidak ada riwayat pesanan terarsip untuk periode ini lee.
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchiveTab;
