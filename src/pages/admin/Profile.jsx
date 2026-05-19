import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { showSuccess, showError, showLoading } from '../../utils/alerts';

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [adminId, setAdminId] = useState('');

  // State Form fields murni string teks
  const [name, setName] = useState('');
  const [password, setPassword] = useState(''); // Dikondisikan kosong sebagai penanda "Tidak Ganti Password"
  const [specialist, setSpecialist] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(''); // Menampung string tautan URL dari ImgBB

  useEffect(() => {
    const id = localStorage.getItem('adminId');
    if (id) {
      setAdminId(id);
      fetchProfileData(id);
    }
  }, []);

  const fetchProfileData = async (id) => {
    try {
      setLoading(true);

      // Mengambil data nama, avatar, dan spesialis (password di-bypass agar tidak menampilkan hash)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          name,
          avatar,
          admin_profiles (specialist)
        `)
        .eq('id', id)
        .single();

      if (userError) throw userError;

      if (userData) {
        setName(userData.name);
        setPassword(''); // 🌟 Selalu kosongkan saat load awal biar gak nampilin string hash
        setAvatarUrl(userData.avatar || '');
        setSpecialist(userData.admin_profiles?.specialist || '');
      }
    } catch (error) {
      console.error("Gagal memuat profil database lee:", error);
      showError("Gagal mengambil data profil lu dari server.");
    } finally {
      setLoading(false);
    }
  };

  // 💾 FUNGSI SIMPAN PERUBAHAN KE SUPABASE
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    if (!name.trim() || !specialist.trim() || !avatarUrl.trim()) {
      showError("Kolom Nama, Tautan Avatar, dan Spesialis wajib diisi lee!");
      return;
    }

    try {
      setIsSaving(true);
      showLoading();

      // Bungkus data yang pasti diubah
      const userUpdateData = {
        name: name.trim(),
        avatar: avatarUrl.trim()
      };

      // 🌟 JIKA KOLOM PASSWORD DIISI, BARU KITA IKUTKAN KE AMANDEMEN DATABASE
      if (password.trim() !== '') {
        userUpdateData.password = password; // Otomatis memicu trigger gilingan Bcrypt di Supabase
      }

      // 1. Update data personal ke tabel `users`
      const { error: userUpdateError } = await supabase
        .from('users')
        .update(userUpdateData)
        .eq('id', adminId);

      if (userUpdateError) throw userUpdateError;

      // 2. Update data keahlian ke tabel `admin_profiles`
      const { error: profileUpdateError } = await supabase
        .from('admin_profiles')
        .update({ specialist: specialist.trim() })
        .eq('user_id', adminId);

      if (profileUpdateError) throw profileUpdateError;

      // 3. Perbarui nama di session lokal biar sinkron seketika
      localStorage.setItem('adminName', name.trim());

      showSuccess("Profil toko lu berhasil diperbarui lee!").then(() => {
        window.location.reload();
      });

    } catch (error) {
      console.error("Database Update Profile Error:", error);
      showError("Terjadi kendala saat menyimpan profil ke database lee.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center text-slate-400 font-bold text-xs tracking-wider animate-pulse">
        MEMUAT DATA PROFIL INTERN LEE...
      </div>
    );
  }

  return (
    <div className="max-w-[480px] mx-auto animate-fade-in font-['Inter'] px-2 pb-10">
      <div className="bg-white rounded-[40px] p-8 shadow-[0_20px_50px_rgba(188,204,255,0.3)] border border-slate-100 text-left">
        
        {/* Pratinjau Bundar Avatar (Live Preview berdasarkan isi input text) */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-24 h-24 rounded-[32px] overflow-hidden bg-slate-100 border-4 border-slate-50 shadow-md">
            <img 
              src={avatarUrl.trim() !== '' ? avatarUrl : 'https://via.placeholder.com/150'} 
              alt="Avatar Live Preview" 
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Katalog+Error'; }}
            />
          </div>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-3">Live Preview Avatar</p>
        </div>

        {/* Form Isian Profil */}
        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div>
            <label className="block text-[13px] font-bold text-[#0f172a] mb-2 ml-1 uppercase tracking-wider">
              Nama Lengkap Admin
            </label>
            <input 
              required
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#f3f4f6] p-4 rounded-2xl outline-none border-2 border-transparent focus:border-[#2557e0]/20 focus:bg-white transition-all text-[#475569] font-bold"
              placeholder="Masukkan nama tampilan lu"
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#0f172a] mb-2 ml-1 uppercase tracking-wider">
              Tautan URL Avatar (ImgBB / External)
            </label>
            <input 
              required
              type="text" 
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full bg-[#f3f4f6] p-4 rounded-2xl outline-none border-2 border-transparent focus:border-[#2557e0]/20 focus:bg-white transition-all text-[#2557e0] font-medium text-xs"
              placeholder="Tempel link https://i.ibb.co/xxxx/avatar.png di sini"
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#0f172a] mb-2 ml-1 uppercase tracking-wider">
              Kata Sandi / Password (Kosongkan jika tidak ingin diubah)
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#f3f4f6] p-4 rounded-2xl outline-none border-2 border-transparent focus:border-[#2557e0]/20 focus:bg-white transition-all text-[#475569] font-mono tracking-wide"
              placeholder="Isi hanya jika ingin ganti password baru lee"
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#0f172a] mb-2 ml-1 uppercase tracking-wider">
              Spesialis / Keahlian Tema
            </label>
            <input 
              required
              type="text" 
              value={specialist}
              onChange={(e) => setSpecialist(e.target.value)}
              className="w-full bg-[#f3f4f6] p-4 rounded-2xl outline-none border-2 border-transparent focus:border-[#2557e0]/20 focus:bg-white transition-all text-[#475569] font-medium"
              placeholder="Contoh: Anime, Minimalist, iOS Style"
            />
          </div>

          <button 
            type="submit"
            disabled={isSaving}
            className={`w-full text-white py-4 rounded-2xl font-black uppercase tracking-wider shadow-xl transition-all mt-4 text-xs ${
              isSaving 
                ? 'bg-slate-300 shadow-none cursor-not-allowed' 
                : 'bg-[#2557e0] shadow-blue-200 hover:bg-[#1e46b3] active:scale-95'
            }`}
          >
            {isSaving ? 'Menyimpan Berkas...' : 'Simpan Pembaruan Profil'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default Profile;
