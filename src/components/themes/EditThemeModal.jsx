import React, { useState, useEffect } from 'react';

const EditThemeModal = ({ isOpen, onClose, onUpdate, themeToEdit }) => {
  const [editedTheme, setEditedTheme] = useState({ title: '', tag: '', price: '', img: '', previewLink: '' });

  useEffect(() => {
    if (themeToEdit) {
      setEditedTheme({
        title: themeToEdit.title || '',
        tag: themeToEdit.tag || '',
        price: themeToEdit.price || '',
        img: themeToEdit.img || '',
        previewLink: themeToEdit.previewLink || '' // <-- Auto-fill data link lama jika ada
      });
    }
  }, [themeToEdit, isOpen]);

  if (!isOpen || !themeToEdit) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!editedTheme.title.trim() || !editedTheme.tag.trim() || !editedTheme.price.trim() || !editedTheme.img.trim()) {
      alert('Tolong jangan kosongkan data tema lee!');
      return;
    }

    onUpdate(themeToEdit.id, {
      title: editedTheme.title.trim(),
      tag: editedTheme.tag.trim(),
      price: editedTheme.price.trim(),
      img: editedTheme.img.trim(),
      previewLink: editedTheme.previewLink.trim() // <-- Simpan update link video baru
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-white z-[999] animate-slide-up flex flex-col font-['Inter']">
      
      {/* TOP BAR MODAL */}
      <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-white sticky top-0 z-10">
        <div>
          <h3 className="text-lg font-black text-[#0f172a] tracking-tight">Edit Varian Master</h3>
          <p className="text-[11px] text-slate-400 font-medium">Mengubah ID: {themeToEdit.id}</p>
        </div>
        <button type="button" onClick={onClose} className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-500 active:scale-90 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* FORM BODY */}
      <form onSubmit={handleSubmit} className="flex-1 p-6 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-6">
          
          {/* NAMA THEME */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Desain Tema</label>
            <input
              type="text" required placeholder="Contoh: Cyber Minimal" value={editedTheme.title}
              onChange={e => setEditedTheme({ ...editedTheme, title: e.target.value })}
              className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-bold text-[#0f172a] outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/5 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* KATEGORI TAG */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Kategori Tag</label>
              <input
                type="text" required placeholder="Contoh: Anime, Cyber" value={editedTheme.tag}
                onChange={e => setEditedTheme({ ...editedTheme, tag: e.target.value })}
                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-bold text-[#0f172a] outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/5 transition-all"
              />
            </div>

            {/* HARGA VARIAN */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Harga Varian</label>
              <input
                type="text" required placeholder="Contoh: 15K" value={editedTheme.price}
                onChange={e => setEditedTheme({ ...editedTheme, price: e.target.value })}
                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-bold text-[#0f172a] outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/5 transition-all"
              />
            </div>
          </div>

          {/* URL IMGBB */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">URL Gambar Preview (ImgBB)</label>
            <input
              type="url" required placeholder="https://i.ibb.co/..." value={editedTheme.img}
              onChange={e => setEditedTheme({ ...editedTheme, img: e.target.value })}
              className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-bold text-[#0f172a] outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/5 transition-all"
            />
          </div>

          {/* NEW: INPUT URL PREVIEW VIDEO EDIT */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">URL Video Preview (TikTok / YouTube / DLL)</label>
            <input
              type="url"
              placeholder="https://tiktok.com/@... atau https://youtube.com/shorts/..."
              value={editedTheme.previewLink}
              onChange={e => setEditedTheme({ ...editedTheme, previewLink: e.target.value })}
              className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-bold text-[#0f172a] outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/5 transition-all"
            />
          </div>

          {/* LIVE PREVIEW MINI */}
          <div className="pt-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Live Preview Gambar</label>
            <div className="w-20 aspect-[9/16] rounded-xl overflow-hidden border border-slate-100 bg-slate-50 shadow-sm">
              <img src={editedTheme.img} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.target.src = "https://via.placeholder.com/360x640?text=Error"} />
            </div>
          </div>

        </div>

        {/* BOTTOM ACTION */}
        <div className="pt-8 pb-4 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 bg-slate-50 text-slate-400 border border-slate-100 py-4 rounded-2xl text-xs font-black uppercase tracking-widest active:scale-[0.97] hover:bg-slate-100 transition-all">
            Batal
          </button>
          <button type="submit" className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-[0_8px_24px_rgba(16,185,129,0.2)] active:scale-[0.97] hover:bg-emerald-700 transition-all">
            Simpan Perubahan
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditThemeModal;
