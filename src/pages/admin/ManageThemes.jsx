import React, { useState, useEffect } from 'react';
import ThemeCard from '../../components/themes/ThemeCard';
import AddThemeModal from '../../components/themes/AddThemeModal';
import EditThemeModal from '../../components/themes/EditThemeModal';
import { supabase } from '../../utils/supabaseClient'; 
import { showError, showSuccess, showLoading } from '../../utils/alerts';

const ManageThemes = ({ role, adminName }) => {
  const [themes, setThemes] = useState([]);
  const [adminCatalogs, setAdminCatalogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedThemeToEdit, setSelectedThemeToEdit] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // =========================================================================
  // 1. FETCH DATA (KODE DISINKRONKAN DENGAN ATURAN GAWANG RLS DATABASE)
  // =========================================================================
  // 🚀 OPTIMASI: Tambah opsi silentFetch agar tidak memicu kedipan layar loading global
  const fetchAllData = async (silentFetch = false) => {
    const currentAdminId = localStorage.getItem('adminId');

    if (!currentAdminId) {
      console.warn("Sesi admin tidak terdeteksi, menunda penarikan katalog RLS lee.");
      return;
    }

    try {
      // Layar loading putih berkedip hanya aktif jika BUKAN silent fetch
      if (!silentFetch) {
        setLoading(true);
      }

      // A. Tarik master tema
      const { data: themesData, error: themesError } = await supabase
        .from('themes')
        .select('*')
        .order('id', { ascending: true });

      if (themesError) throw themesError;
      setThemes(themesData || []);

      // B. Tarik data user
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name');

      if (usersError) {
        console.warn("Gagal muat data users akibat batasan RLS, master tema tetap aman:", usersError);
        return; 
      }

      // C. Tarik jembatan etalase toko
      const { data: catalogsData, error: catalogsError } = await supabase
        .from('admin_catalogs')
        .select('user_id, theme_id');

      if (!catalogsError && usersData) {
        const formattedCatalogs = usersData.map(user => {
          const selectedIds = catalogsData
            .filter(c => c.user_id === user.id)
            .map(c => parseInt(c.theme_id));
            
          return {
            adminName: user.name,
            selectedThemeIds: selectedIds
          };
        });
        setAdminCatalogs(formattedCatalogs);
      }
    } catch (error) {
      console.error("Detail Eror Fatal RLS Supabase Themes:", error);
      showError("Gagal menyinkronkan koneksi tabel katalog terproteksi RLS lee.");
    } finally {
      // Matikan status loading di akhir siklus
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData(false); // Fetch pertama kali wajib pakai loading screen bawaan
  }, [adminName]);

  // Pencarian toleran huruf kecil/besar untuk nama admin saat ini
  const currentCatalog = Array.isArray(adminCatalogs) 
    ? adminCatalogs.find(c => c.adminName?.toLowerCase().trim() === adminName?.toLowerCase().trim()) 
    : null;
    
  const selectedThemeIds = currentCatalog && currentCatalog.selectedThemeIds ? currentCatalog.selectedThemeIds : [];

  // =========================================================================
  // 2. CRUD OPERATIONS (TERVALIDASI ATURAN INTERNAL TIM RLS)
  // =========================================================================
  const handleAddMasterTheme = async (newThemeObj) => {
    if (role !== 'super') {
      showError("Akses ditolak! Hanya Super Admin yang diizinkan memodifikasi master tema pusat lee.");
      return;
    }
    try {
      showLoading();
      
      const { error } = await supabase
        .from('themes')
        .insert([
          {
            title: newThemeObj.title,
            tag: newThemeObj.tag,
            price: newThemeObj.price,
            img: newThemeObj.img,
            preview_link: newThemeObj.previewLink || ''
          }
        ]);

      if (error) throw error;
      
      await fetchAllData(true); // Ganti data latar belakang secara senyap
      showSuccess("Varian master tema baru berhasil ditambahkan!");
      setIsAddOpen(false); 
    } catch (error) {
      console.error("Gagal Insert Data Tema RLS. Detail:", error);
      showError(`Gagal menambah data lee. Sensor RLS mendeteksi pelanggaran hak akses.`);
    }
  };

  const handleEditMasterTheme = async (themeId, updatedFields) => {
    if (role !== 'super') {
      showError("Akses ditolak! Hanya Super Admin yang berhak merubah data master katalog.");
      return;
    }
    try {
      showLoading();
      const { error } = await supabase
        .from('themes')
        .update({
          title: updatedFields.title,
          tag: updatedFields.tag,
          price: updatedFields.price,
          img: updatedFields.img,
          preview_link: updatedFields.previewLink
        })
        .eq('id', parseInt(themeId));

      if (error) throw error;

      await fetchAllData(true); // Ganti data latar belakang secara senyap
      showSuccess("Perubahan master tema berhasil disimpan!");
      setIsEditOpen(false);
    } catch (error) {
      console.error("Error update theme RLS:", error);
      showError("Gagal mengupdate varian tema akibat batasan RLS database lee.");
    }
  };

  const handleDeleteMasterTheme = async (themeId) => {
    if (role !== 'super') {
      showError("Akses ditolak! Menghapus katalog master murni hak kendali Super Admin.");
      return;
    }
    try {
      showLoading();
      const { error } = await supabase
        .from('themes')
        .delete()
        .eq('id', parseInt(themeId));

      if (error) throw error;

      await fetchAllData(true); // Ganti data latar belakang secara senyap
      showSuccess("Tema berhasil dihapus dari pusat database!");
    } catch (error) {
      console.error("Error delete theme RLS:", error);
      showError("Gagal menghapus tema, aksi ditolak oleh sensor keamanan database.");
    }
  };

  const handleToggleThemeSelection = async (themeId) => {
    const userId = localStorage.getItem('adminId');

    if (!userId) {
      showError("Sesi token identitas lu tidak ditemukan, aksi etalase dibatalkan lee.");
      return;
    }

    try {
      const targetThemeId = parseInt(themeId);
      const isAlreadySelected = selectedThemeIds.includes(targetThemeId);

      if (isAlreadySelected) {
        const { error: deleteError } = await supabase
          .from('admin_catalogs')
          .delete()
          .eq('user_id', userId)
          .eq('theme_id', targetThemeId);

        if (deleteError) throw deleteError;
      } else {
        const { error: insertError } = await supabase
          .from('admin_catalogs')
          .insert([{ user_id: userId, theme_id: targetThemeId }]);

        if (insertError) throw insertError;
      }

      // 🔥 UTAMA: Jalankan re-fetch secara senyap tanpa merusak pohon DOM komponen
      await fetchAllData(true);
    } catch (error) {
      console.error("Gagal mengubah etalase toko via RLS:", error);
      showError("Gagal merubah pajangan etalase. Aturan RLS mendeteksi anomali.");
    }
  };

  const filteredThemes = themes.filter(theme => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return theme.title?.toLowerCase().includes(query) || 
           theme.tag?.toLowerCase().includes(query) || 
           theme.price?.toLowerCase().includes(query);
  });

  const handleOpenEdit = (themeObj) => {
    setSelectedThemeToEdit({ ...themeObj, previewLink: themeObj.preview_link });
    setIsEditOpen(true);
  };

  // Layar ini HANYA akan mencegat user saat memuat halaman pertama kali saja lee!
  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 text-slate-400 font-bold text-xs tracking-wider animate-pulse">
        SINKRONISASI DATABASE KATALOG TOKO...
      </div>
    );
  }

  return (
    <div className="font-['Inter'] animate-fade-in pb-12">
      <div className="bg-white p-5 rounded-[30px] border border-slate-100 shadow-sm mb-4 flex justify-between items-center">
        <div>
          <span className="bg-blue-50 text-[#2557e0] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            {role === 'super' ? 'Central Hub' : 'Etalase Toko'}
          </span>
          <h2 className="text-xl font-black text-[#0f172a] mt-1 tracking-tight">
            {role === 'super' ? 'Master Katalog Pusat' : 'Kurasi Katalog Lu'}
          </h2>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            Total koleksi data resmi: {themes?.length || 0} desain di Supabase.
          </p>
        </div>

        {role === 'super' && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="bg-[#2557e0] text-white text-[11px] font-black uppercase tracking-wider px-4 py-3 rounded-xl shadow-md active:scale-95 transition-transform"
          >
            + Varian
          </button>
        )}
      </div>

      <div className="relative mb-5 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center px-4 overflow-hidden focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-500/5 transition-all">
        <div className="text-slate-400 shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Cari judul, kategori tag, atau harga..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full py-4 px-3 text-xs font-bold text-[#0f172a] bg-transparent outline-none placeholder:text-slate-300"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filteredThemes.length > 0 ? (
          filteredThemes.map((model) => (
            <ThemeCard
              key={model.id}
              model={{ ...model, previewLink: model.preview_link }}
              role={role}
              adminName={adminName}
              selectedThemeIds={selectedThemeIds}
              adminCatalogs={adminCatalogs}
              toggleThemeSelection={handleToggleThemeSelection}
              deleteMasterTheme={handleDeleteMasterTheme}
              onEditClick={handleOpenEdit}
            />
          ))
        ) : (
          <div className="col-span-2 text-center text-slate-400 italic text-xs py-14 bg-white rounded-[32px] border border-slate-100 px-6">
            Belum ada data tema terdaftar di database Supabase pusat lee.<br/>
            Klik tombol <span className="font-bold text-blue-600">+ Varian</span> di atas untuk mengisinya pertama kali!
          </div>
        )}
      </div>

      <AddThemeModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSave={handleAddMasterTheme} />
      <EditThemeModal isOpen={isEditOpen} onClose={() => { setIsEditOpen(false); setSelectedThemeToEdit(null); }} themeToEdit={selectedThemeToEdit} onUpdate={handleEditMasterTheme} />
    </div>
  );
};

export default ManageThemes;
