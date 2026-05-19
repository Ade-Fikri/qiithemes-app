import React from 'react';

const ThemeCard = ({
  model,
  role,
  adminName,
  selectedThemeIds = [],
  adminCatalogs = [],
  toggleThemeSelection,
  deleteMasterTheme,
  onEditClick
}) => {
  const isSelectedByMe = selectedThemeIds.includes(model.id);

  const displayCount = Array.isArray(adminCatalogs)
    ? adminCatalogs.filter(c => c.selectedThemeIds?.includes(model.id)).length
    : 0;

  return (
    <div
      className={`bg-white p-3.5 rounded-[32px] border transition-all duration-300 flex flex-col justify-between ${
        role !== 'super' && isSelectedByMe
          ? 'border-blue-500 shadow-[0_12px_30px_rgba(37,87,224,0.08)] bg-blue-50/5'
          : 'border-slate-100 shadow-[0_8px_24px_rgba(15,23,42,0.02)] hover:shadow-[0_12px_32px_rgba(15,23,42,0.04)]'
      }`}
    >
      {/* 1. AREA PREVIEW GAMBAR (ONLY TAG FLOATING WITH GLASSMORPHISM) */}
      <div className="relative overflow-hidden rounded-[24px] aspect-[9/16] bg-slate-50 border border-slate-100 group">
        <img
          src={model.img}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          alt={model.title}
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/360x640?text=Image+Not+Found";
          }}
        />

        {/* Badge Tag Kaca Melayang di Kiri Atas Gambar */}
        <span className="absolute top-2.5 left-2.5 text-[8px] bg-slate-900/60 text-white backdrop-blur-md px-2.5 py-1 rounded-xl font-black uppercase tracking-wider border border-white/10 z-10">
          {model.tag}
        </span>
      </div>

      {/* 2. AREA INFORMASI DETAIL TEMA */}
      <div className="text-left mt-3 px-0.5 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          {/* JUDUL TEMA */}
          <h3 className="text-[13px] font-black text-[#0f172a] line-clamp-1 tracking-tight leading-tight">
            {model.title}
          </h3>

          {/* HARGA & INDIKATOR SIRKULASI */}
          <div className="flex justify-between items-center text-[11px]">
            <p className="text-slate-400 font-medium">
              Mulai <span className="text-blue-600 font-black text-xs ml-0.5">{model.price}</span>
            </p>
            {role === 'super' && (
              <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md text-[9px] font-extrabold tracking-tight">
                {displayCount} Admin
              </span>
            )}
          </div>
        </div>

        {/* 3. STRIP AKSI BERLAPIS (UX STRATIFIED LAYOUT) */}
        <div className="mt-3.5 space-y-2 w-full">
          
          {/* BARIS UTAMA: TOMBOL SAKLAR PAJANG (MEMANJANG PENUH) */}
          <button
            onClick={() => toggleThemeSelection(model.id)}
            className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 active:scale-[0.96] border ${
              isSelectedByMe
                ? 'bg-blue-600 text-white border-blue-600 shadow-[0_6px_16px_rgba(37,87,224,0.15)]'
                : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
            }`}
          >
            {isSelectedByMe ? '✓ Terpajang' : 'Pajang Tema'}
          </button>

          {/* BARIS SEKUNDER: KONTROL MANAGEMENT (Hanya Muncul di Super Admin) */}
          {role === 'super' && (
            <div className="flex gap-2 w-full">
              {/* TOMBOL EDIT MODAL */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditClick(model);
                }}
                className="flex-1 bg-slate-50 border border-slate-100 text-slate-600 h-9 rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-bold active:scale-[0.95] hover:bg-slate-100 transition-all"
                title="Edit Tema"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span>Edit</span>
              </button>

              {/* TOMBOL HAPUS PERMANEN */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Hapus master tema "${model.title}"? Ini bakal menghapus tema ini dari katalog seluruh admin lee!`)) {
                    deleteMasterTheme(model.id);
                  }
                }}
                className="flex-1 bg-red-50 border border-red-100 text-red-500 h-9 rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-bold active:scale-[0.95] hover:bg-red-100 transition-all"
                title="Hapus Permanen"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Hapus</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ThemeCard;
