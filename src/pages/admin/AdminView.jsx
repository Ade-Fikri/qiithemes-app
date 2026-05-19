import React, { useState, useEffect } from 'react';

const AdminView = ({ 
  currentProfile, 
  updateProfile, 
  orders, 
  activeOrders, 
  updateStatus,
  // 🛠️ Tangkap status siklus kontrol manual dari induk
  appStatus,
  isClosingDay 
}) => {
  const [localSlot, setLocalSlot] = useState(currentProfile.slot);
  const [localTotal, setLocalTotal] = useState(currentProfile.totalSlot);

  useEffect(() => {
    setLocalSlot(currentProfile.slot);
    setLocalTotal(currentProfile.totalSlot);
  }, [currentProfile.slot, currentProfile.totalSlot]);

  // Deteksi status gembok untuk admin biasa
  const isLocked = appStatus === 'PRE_CLOSING';

  const handleSlotBlur = async () => {
    if (isLocked) return;
    const targetValue = parseInt(localSlot) || 0;
    
    // Validasi frontend agar sisa slot tidak melompati total kapasitas aktif
    if (targetValue > localTotal) {
      alert(`Sisa slot tidak boleh melebihi total slot (${localTotal}) lee!`);
      setLocalSlot(currentProfile.slot);
      return;
    }

    const success = await updateProfile('slot', targetValue);
    if (!success) {
      setLocalSlot(currentProfile.slot); 
    }
  };

  const handleTotalBlur = async () => {
    if (isLocked) return;
    const targetValue = parseInt(localTotal) || 0;

    // Validasi frontend agar total kapasitas tidak diperkecil di bawah sisa slot yang sedang berjalan
    if (targetValue < localSlot) {
      alert(`Total kapasitas tidak boleh lebih kecil dari sisa slot aktif (${localSlot}) lee!`);
      setLocalTotal(currentProfile.totalSlot);
      return;
    }

    const success = await updateProfile('totalSlot', targetValue);
    if (!success) {
      setLocalTotal(currentProfile.totalSlot);
    }
  };

  return (
    <>
      <div className="mb-8 bg-[#0f172a] p-6 rounded-[35px] text-white shadow-xl shadow-blue-900/20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-black tracking-tight">Status Kerja</h2>
          <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${currentProfile.status === 'Online' ? 'bg-green-500' : 'bg-red-500'}`}>
            {currentProfile.status}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-4">
          <button 
            onClick={() => !isLocked && updateProfile('status', currentProfile.status === 'Online' ? 'Offline' : 'Online')}
            disabled={isLocked}
            className={`p-4 rounded-2xl text-center border border-white/10 transition-all ${
              isLocked 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-40' 
                : currentProfile.status === 'Online' ? 'bg-red-500/20 text-red-200 hover:bg-red-500/30' : 'bg-green-500/20 text-green-200 hover:bg-green-500/30'
            }`}
          >
            <p className="text-[11px] font-bold tracking-widest">
              {isLocked ? 'STATUS DIKUNCI PUSAT' : `SET ${currentProfile.status === 'Online' ? 'OFFLINE' : 'ONLINE'}`}
            </p>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Box Sisa Slot */}
          <div className={`border p-4 rounded-2xl transition-all duration-300 ${
            isLocked ? 'bg-white/5 border-white/5 opacity-40' : 'bg-white/5 border-white/10'
          }`}>
            <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Sisa Slot</p>
            <input 
              type="number" 
              value={localSlot}
              onChange={(e) => setLocalSlot(e.target.value)}
              onBlur={handleSlotBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleSlotBlur()}
              disabled={isLocked}
              className="bg-transparent w-full text-sm font-bold outline-none border-b border-white/20 text-white disabled:cursor-not-allowed"
            />
          </div>

          {/* Box Total Slot */}
          <div className={`border p-4 rounded-2xl transition-all duration-300 ${
            isLocked ? 'bg-white/5 border-white/5 opacity-40' : 'bg-white/5 border-white/10'
          }`}>
            <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Total Slot</p>
            <input 
              type="number" 
              value={localTotal}
              onChange={(e) => setLocalTotal(e.target.value)}
              onBlur={handleTotalBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleTotalBlur()}
              disabled={isLocked}
              className="bg-transparent w-full text-sm font-bold outline-none border-b border-white/20 text-white disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* 🛠️ NOTIFIKASI INFORMASI PERIODE CLOSING UNTUK STAFF */}
      {isLocked && (
        <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-[24px] text-[11px] font-bold text-amber-800 animate-pulse leading-relaxed mx-1">
          ⚠️ PERIODE CLOSING AKTIF: Toko ditutup sementara dari orderan baru. Silakan selesaikan seluruh pesanan menggantung di bawah ini menjadi sukses lee!
        </div>
      )}

      <h2 className="text-xl font-black text-[#0f172a] mb-4 px-2 tracking-tight">Pesanan Kamu</h2>
      <OrderList orders={activeOrders} updateStatus={updateStatus} appStatus={appStatus} />
    </>
  );
};

export const OrderList = ({ orders, updateStatus, appStatus }) => {
  // 🛠️ DETEKSI UTANG GLOBAL: Cek apakah masih ada kerjaan gantung di sistem pembukuan bulan berjalan
  const isPreClosing = appStatus === 'PRE_CLOSING';
  const anyOrderUnfinished = orders.some(o => o.status === 'pending' || o.status === 'proses');
  
  // Gembok tombol aksi JIKA aplikasi berada dalam fase pre-closing DAN seluruh kerjaan gantung sudah sukses dibersihkan
  const isActionFrozen = isPreClosing && !anyOrderUnfinished;

  // 🌟 HELPER LOGIC: Mengubah format input mentah nomor WA menjadi standar internasional API wa.me
  const formatWhatsAppNumber = (rawNumber) => {
    if (!rawNumber) return '';
    // 1. Bersihkan semua karakter non-angka (+, spasi, strip, dll)
    let cleaned = rawNumber.replace(/[^0-9]/g, '');

    // 2. Jika nomor diawali dengan angka '0', potong dan konversi ke kode negara '62'
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    }

    return cleaned;
  };

  // 📝 HELPER LOGIC: Membuat template pesan teks otomatis berbasis data orderan customer
  const generateWhatsAppTemplate = (order) => {
    const message = `Halo ${order.userName}, konfirmasi pesanan kamu di QiiThemes sudah masuk lee! 😊\n\n` +
                    `*Detail Orderan:*\n` +
                    `• Karakter: ${order.characterName || '-'}\n` +
                    `• Model Tema: ${order.themeModel}\n` +
                    `• Harga: ${order.price}\n` +
                    `• Status Saat Ini: *${order.status.toUpperCase()}*\n\n` +
                    `Mohon ditunggu proses pengerjaannya ya. Jika ada aset gambar atau detail tambahan yang mau dikirim, bisa langsung balas di bawah ini bre! Terima kasih! 🙏`;
    
    return encodeURIComponent(message);
  };

  return (
    <div className="space-y-4">
      {orders.length > 0 ? (
        orders.map((order) => (
          <div key={order.id} className="bg-white p-5 rounded-[30px] border border-slate-100 shadow-sm animate-fade-in">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-[#0f172a] text-sm">{order.userName}</h3>
                <p className="text-[10px] text-blue-600 font-bold tracking-tight uppercase mt-0.5">Karakter: {order.characterName || '-'}</p>
                <p className="text-[11px] text-[#94a3b8] italic mt-1">Model: {order.themeModel} ({order.price})</p>
              </div>
              <span className={`text-[9px] px-2.5 py-1 rounded-md font-black uppercase tracking-wider ${
                order.status === 'pending' ? 'bg-orange-100 text-orange-600' : 
                order.status === 'proses' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
              }`}>{order.status}</span>
            </div>
            <div className="flex gap-2 items-center">
              {/* 🚀 UPGRADE SELESAI: Sekarang link wa.me otomatis menyuntikkan query text template pesan */}
              <a 
                href={`https://wa.me/${formatWhatsAppNumber(order.waNumber)}?text=${generateWhatsAppTemplate(order)}`} 
                target="_blank" 
                rel="noreferrer" 
                className="flex-1 bg-[#2ecc71] hover:bg-[#27ae60] text-white py-3 rounded-xl flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-wider transition-all"
              >
                Chat WA
              </a>
              <div className="flex gap-1">
                {['pending', 'proses', 'sukses'].map((s) => {
                  const isActive = order.status === s;
                  return (
                    <button 
                      key={s} 
                      onClick={() => !isActionFrozen && updateStatus(order.id, s)}
                      disabled={isActionFrozen}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black uppercase transition-all ${
                        isActionFrozen
                          ? 'bg-slate-100 text-slate-300 cursor-not-allowed opacity-50'
                          : isActive ? 'bg-[#0f172a] text-white shadow-md scale-105' : 'bg-slate-50 text-slate-300 hover:bg-slate-100'
                      }`}
                      title={isActionFrozen ? "Data dikunci menjelang ekspor arsip" : `Set status ke ${s}`}
                    >
                      {s.charAt(0)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center text-slate-400 italic text-xs py-12 bg-white rounded-[30px] border border-slate-100 px-4">
          Belum ada orderan masuk lee.
        </div>
      )}
    </div>
  );
};

export default AdminView;
