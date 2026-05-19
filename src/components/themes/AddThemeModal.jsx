import React, { useState } from 'react';

const AddThemeModal = ({ isOpen, onClose, onSave }) => {
  // Tambahkan state penampung previewLink awal kosong
  const [newTheme, setNewTheme] = useState({ title: '', tag: '', price: '', img: '', previewLink: '' });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newTheme.title.trim() || !newTheme.tag.trim() || !newTheme.price.trim() || !newTheme.img.trim()) {
      alert('Tolong isi semua data varian tema lee!');
      return;
    }

    onSave({
      title: newTheme.title.trim(),
      tag: newTheme.tag.trim(),
      price: newTheme.price.trim(),
      img: newTheme.img.trim(),
      previewLink: newTheme.previewLink.trim() // <-- Oper data link preview baru
    });

    setNewTheme({ title: '', tag: '', price: '', img: '', previewLink: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-white z-[999] animate-slide-up flex flex-col font-['Inter']">
      
      {/* TOP BAR MODAL */}
      <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-white sticky top-0 z-10">
        <div>
          <h3 className="text-lg font-black text-[#0f172a] tracking-tight">
            Tambah Varian Baru
          </h3>
          <p className="text-[11px] text-slate-400 font-medium">Katalog Induk Pusat</p>
        </div>
        <button onClick={onClose} className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-500 active:scale-90 transition-transform">
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
              type="text" required placeholder="Contoh: Cyber Minimal" value={newTheme.title}
              onChange={e => setNewTheme({ ...newTheme, title: e.target.value })}
              className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-bold text-[#0f172a] outline-none placeholder:text-slate-300 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/5 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* KATEGORI TAG */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Kategori Tag</label>
              <input
                type="text" required placeholder="Contoh: Anime, Cyber" value={newTheme.tag}
                onChange={e => setNewTheme({ ...newTheme, tag: e.target.value })}
                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-bold text-[#0f172a] outline-none placeholder:text-slate-300 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/5 transition-all"
              />
            </div>

            {/* HARGA VARIAN */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Harga Varian</label>
              <input
                type="text" required placeholder="Contoh: 15K" value={newTheme.price}
                onChange={e => setNewTheme({ ...newTheme, price: e.target.value })}
                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-bold text-[#0f172a] outline-none placeholder:text-slate-300 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/5 transition-all"
              />
            </div>
          </div>

          {/* URL IMGBB */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">URL Gambar Preview (ImgBB)</label>
            <input
              type="url" required placeholder="https://i.ibb.co/..." value={newTheme.img}
              onChange={e => setNewTheme({ ...newTheme, img: e.target.value })}
              className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-bold text-[#0f172a] outline-none placeholder:text-slate-300 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/5 transition-all"
            />
          </div>

          {/* NEW: INPUT URL PREVIEW VIDEO */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">URL Video Preview (TikTok / YouTube / DLL)</label>
            <input
              type="url"
              placeholder="https://tiktok.com/@... atau https://youtube.com/shorts/..."
              value={newTheme.previewLink}
              onChange={e => setNewTheme({ ...newTheme, previewLink: e.target.value })}
              className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-bold text-[#0f172a] outline-none placeholder:text-slate-300 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/5 transition-all"
            />
          </div>

        </div>

        <div className="pt-8 pb-4">
          <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-[0_8px_24px_rgba(37,87,224,0.15)] active:scale-[0.98] hover:bg-blue-700 transition-all">
            Simpan Desain Master
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddThemeModal;
