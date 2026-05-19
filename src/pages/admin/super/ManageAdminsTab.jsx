import React, { useState, useEffect } from 'react';
import { showError } from '../../../utils/alerts'; // Impor alert biar sinkron jika ketahan di frontend

const ManageAdminsTab = ({ admins, updateProfileOtherAdmin, appStatus }) => {
  const isPreClosing = appStatus === 'PRE_CLOSING';

  return (
    <div className="space-y-4 px-2 animate-fade-in pb-12 font-['Inter']">
      
      <div className="bg-[#edf4ff] p-4 rounded-[24px] border border-blue-100/70">
        <h2 className="text-[11px] font-black text-[#1e40af] uppercase tracking-wider mb-0.5">
          SUPER CONTROL
        </h2>
        <p className="text-[11px] text-[#1e3a8a] font-medium leading-relaxed">
          Sebagai Super Admin, lu bisa paksa buka/tutup toko dan edit kapasitas slot anak-anak lee.
        </p>
      </div>

      {/* 🛠️ BANNER INFO JALUR OVERRIDE UNTUK SUPER ADMIN */}
      {isPreClosing && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-[24px] text-[11px] font-bold text-amber-600 leading-relaxed">
          💡 <span className="font-black">MODE OVERRIDE AKTIF:</span> Meskipun lapak staff terkunci total selama masa closing, lu sebagai Super Admin tetep punya "kunci darurat" buat modifikasi slot atau status mereka di bawah ini lee!
        </div>
      )}
      
      <div className="space-y-4 pt-1">
        {admins.length > 0 ? (
          admins.map((admin) => (
            <AdminCard 
              key={admin.id} 
              admin={admin} 
              updateProfileOtherAdmin={updateProfileOtherAdmin} 
            />
          ))
        ) : (
          <div className="text-center text-slate-400 italic text-xs py-16 bg-white rounded-[32px] border border-slate-100 shadow-sm">
            Belum ada data admin terdaftar lee.
          </div>
        )}
      </div>
    </div>
  );
};

const AdminCard = ({ admin, updateProfileOtherAdmin }) => {
  const [localSlot, setLocalSlot] = useState(admin.slot);
  const [localTotal, setLocalTotal] = useState(admin.totalSlot);
  const [imgError, setImgError] = useState(false); // State pelindung jika link avatar ImgBB mati

  useEffect(() => {
    setLocalSlot(admin.slot);
    setLocalTotal(admin.totalSlot);
    setImgError(false); // Reset status error jika data admins berubah dari database
  }, [admin.slot, admin.totalSlot, admin.avatar]);

  const handleSlotSubmit = async () => {
    const targetValue = parseInt(localSlot) || 0;
    const currentMaxTotal = parseInt(localTotal) || 0;

    // 🛠️ VALIDASI FRONTEND: Bandingkan langsung dengan nilai localTotal input agar sinkron seketika lee
    if (targetValue > currentMaxTotal) {
      showError(`Sisa slot (${targetValue}) tidak boleh melebihi total kapasitas (${currentMaxTotal}) admin ${admin.name} lee!`);
      setLocalSlot(admin.slot); // Balikin nilai input ke data asli database jika melanggar
      return;
    }

    const success = await updateProfileOtherAdmin(admin.name, 'slot', targetValue);
    if (!success) {
      setLocalSlot(admin.slot);
    }
  };

  const handleTotalSubmit = async () => {
    const targetValue = parseInt(localTotal) || 0;
    const currentActiveSlot = parseInt(localSlot) || 0;
    
    // 🛠️ VALIDASI FRONTEND: Cegah total kapasitas diperkecil di bawah sisa slot aktif staf lee!
    if (targetValue < currentActiveSlot) {
      showError(`Total kapasitas (${targetValue}) tidak boleh lebih kecil dari sisa slot yang sedang berjalan (${currentActiveSlot}) untuk admin ${admin.name} lee!`);
      setLocalTotal(admin.totalSlot); // Balikin nilai input ke data asli database jika melanggar
      return;
    }

    const success = await updateProfileOtherAdmin(admin.name, 'totalSlot', targetValue);
    if (!success) {
      setLocalTotal(admin.totalSlot);
    }
  };

  const handleToggleStatus = async () => {
    const nextStatus = admin.status === 'Online' ? 'Offline' : 'Online';
    await updateProfileOtherAdmin(admin.name, 'status', nextStatus);
  };

  const isOnline = admin.status === 'Online';

  return (
    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col gap-5">
      
      {/* 👤 BARIS ATAS: AVATAR REAL-TIME, NAMA, STATUS & TOGGLE BUTTON */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3.5">
          
          {/* Kotak Kontainer Avatar Staf Lu Lee */}
          <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-[18px] flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0">
            {admin.avatar && !imgError ? (
              <img 
                src={admin.avatar} 
                alt={`${admin.name} Avatar`} 
                className="w-full h-full object-cover"
                onError={() => setImgError(true)} // Jika link ImgBB rusak/404, alihkan ke inisial huruf
              />
            ) : (
              <span className="text-slate-400 font-black text-sm">
                {admin.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div>
            <h3 className="font-black text-[#0f172a] text-[15px] tracking-tight">{admin.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                {admin.status}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleToggleStatus}
          className={`text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-xl border transition-all duration-200 active:scale-95 ${
            isOnline
              ? 'bg-rose-50 border-rose-100/60 text-rose-500 hover:bg-rose-100/50'
              : 'bg-green-50 border-green-100/60 text-green-600 hover:bg-green-100/50'
          }`}
        >
          {isOnline ? 'TURN OFFLINE' : 'TURN ONLINE'}
        </button>
      </div>

      {/* 📊 BARIS BAWAH: LAYOUT KOTAK SISA & TOTAL SLOT */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Box Sisa Slot */}
        <div className="bg-[#f8fafc] border border-slate-100/80 p-4 rounded-2xl focus-within:bg-white focus-within:border-blue-500/50 transition-all duration-300">
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mb-2">
            SISA SLOT
          </p>
          <input 
            type="number" 
            value={localSlot}
            onChange={(e) => setLocalSlot(e.target.value)}
            onBlur={handleSlotSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleSlotSubmit()}
            className="bg-transparent w-full text-sm font-black text-[#0f172a] outline-none border-b border-transparent focus:border-slate-200 pb-0.5"
            placeholder="0"
          />
        </div>
        
        {/* Box Total Kapasitas */}
        <div className="bg-[#f8fafc] border border-slate-100/80 p-4 rounded-2xl focus-within:bg-white focus-within:border-blue-500/50 transition-all duration-300">
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mb-2">
            TOTAL KAPASITAS
          </p>
          <input 
            type="number" 
            value={localTotal}
            onChange={(e) => setLocalTotal(e.target.value)}
            onBlur={handleTotalSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleTotalSubmit()}
            className="bg-transparent w-full text-sm font-black text-[#0f172a] outline-none border-b border-transparent focus:border-slate-200 pb-0.5"
            placeholder="0"
          />
        </div>
      </div>

    </div>
  );
};

export default ManageAdminsTab;
