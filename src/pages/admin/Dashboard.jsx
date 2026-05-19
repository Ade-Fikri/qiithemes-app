import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminView from './AdminView';
import SuperAdminView from './SuperAdminView';
import ManageThemes from './ManageThemes';
import ManageAdminsTab from './super/ManageAdminsTab'; 
import Profile from './Profile'; // 🌟 Impor halaman Edit Profile baru lee
import { supabase } from '../../utils/supabaseClient';
import { showError, showSuccess, showLoading } from '../../utils/alerts';

const Dashboard = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('');
  const [adminName, setAdminName] = useState('');
  const [userId, setUserId] = useState('');
  
  const [orders, setOrders] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('orders');
  
  // 🚀 CACHING STATE: Mencegah fetch berulang saat sekadar ganti tab navigasi
  const [isInitialLoaded, setIsInitialLoaded] = useState(false);

  // STATE KONTROL SIKLUS MANUAL
  const [appStatus, setAppStatus] = useState('NORMAL'); 

  // DETEKSI OTOMATIS HARI AKHIR BULAN (UNTUK BANNER)
  const today = new Date();
  const lastDayOfThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const isClosingDay = today.getDate() === lastDayOfThisMonth;

  useEffect(() => {
    const auth = localStorage.getItem('isLoggedIn');
    if (!auth) {
      navigate('/admin/login');
    } else {
      setRole(localStorage.getItem('userRole'));
      setAdminName(localStorage.getItem('adminName'));
      setUserId(localStorage.getItem('adminId'));
    }
  }, [navigate]);

  const fetchDashboardData = async (forceRefresh = false) => {
    // Jika data sudah di-load dan tidak dipaksa refresh, kunci kueri di memori lokal (0ms loading)
    if (isInitialLoaded && !forceRefresh) return;

    const currentUserId = userId || localStorage.getItem('adminId');
    const currentUserRole = role || localStorage.getItem('userRole');
    const currentAdminName = adminName || localStorage.getItem('adminName');

    if (!currentUserRole || !currentAdminName || !currentUserId) return;

    try {
      // Hanya tampilkan loading global jika ini adalah fetch pertama kali atau hard-refresh manual
      if (!isInitialLoaded) {
        setLoading(true);
      }

      // 1. Fetch Status Aplikasi Global dari system_settings
      const { data: settingsData } = await supabase
        .from('system_settings')
        .select('app_status')
        .eq('id', 'main_config')
        .single();
      
      if (settingsData) {
        setAppStatus(settingsData.app_status);
      }

      // 2. Fetch Data Orders (Terproteksi RLS)
      let ordersQuery = supabase
        .from('orders')
        .select(`
          id, customer_name, character_name, whatsapp_number,
          theme_title, theme_price, status, created_at, admin_id,
          is_archived,
          users (name)
        `)
        .eq('is_archived', false);

      if (currentUserRole !== 'super') {
        ordersQuery = ordersQuery.eq('admin_id', currentUserId);
      }

      const { data: ordersData, error: ordersError } = await ordersQuery.order('id', { ascending: false });

      if (ordersError) throw ordersError;

      const formattedOrders = (ordersData || []).map(o => ({
        id: o.id,
        userName: o.customer_name,
        characterName: o.character_name,
        waNumber: o.whatsapp_number,
        themeModel: o.theme_title,
        price: o.theme_price,
        status: o.status,
        created_at: o.created_at,
        adminTarget: o.users?.name || 'Unassigned',
        adminId: o.admin_id
      }));
      setOrders(formattedOrders);

      // 3. Fetch Data Admin Profiles (Terproteksi RLS)
      let profilesQuery = supabase
        .from('admin_profiles')
        .select(`user_id, specialist, status, slot, total_slot, users (name, avatar)`);

      if (currentUserRole !== 'super') {
        profilesQuery = profilesQuery.eq('user_id', currentUserId);
      }

      const { data: profilesData, error: profilesError } = await profilesQuery;

      if (profilesError) throw profilesError;

      const formattedAdmins = (profilesData || []).map(p => ({
        id: p.user_id,
        name: p.users?.name || 'Unknown',
        specialist: p.specialist,
        status: p.status,
        slot: p.slot,
        totalSlot: p.total_slot,
        avatar: p.users?.avatar
      }));
      setAdmins(formattedAdmins);

      const myProfile = formattedAdmins.find(a => a.id === currentUserId || a.name.toLowerCase().trim() === currentAdminName.toLowerCase().trim());
      if (myProfile) {
        setCurrentProfile(myProfile);
      }
      
      setIsInitialLoaded(true);
    } catch (error) {
      console.error("Dashboard Fetch Error pasca-RLS:", error);
      showError("Gagal menyinkronkan data kredensial RLS database lee.");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 1. INITIAL MOUNT: Jalankan penarikan data utama HANYA ketika sesi otentikasi lokal siap
  useEffect(() => {
    if (role && adminName && userId) {
      fetchDashboardData();
    }
  }, [role, adminName, userId]);

  // 🔥 2. OPTIMASI SELESAI: Realtime listener dibersihkan dari ketergantungan isInitialLoaded
  useEffect(() => {
    const currentUserId = userId || localStorage.getItem('adminId');
    const currentUserRole = role || localStorage.getItem('userRole');
    if (!currentUserId) return;

    const orderFilter = currentUserRole === 'super' ? '*' : `admin_id=eq.${currentUserId}`;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: orderFilter },
        () => { fetchDashboardData(true); } // Tarik data baru di latar belakang jika ada mutasi
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admin_profiles' },
        () => { fetchDashboardData(true); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_settings', filter: 'id=eq.main_config' },
        () => { fetchDashboardData(true); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, role]); // 💡 Bersih! isInitialLoaded dikeluarkan demi memutus loop re-fetch.

  const closeTokoSiklus = async () => {
    if (role !== 'super') {
      showError("Akses ditolak! Hanya Super Admin yang memiliki kendali saklar closing lee.");
      return;
    }
    try {
      showLoading();
      
      const { error: settingsError } = await supabase
        .from('system_settings')
        .update({ app_status: 'PRE_CLOSING', updated_at: new Date() })
        .eq('id', 'main_config');

      if (settingsError) throw settingsError;

      const { error: profilesError } = await supabase
        .from('admin_profiles')
        .update({ slot: 0 });

      if (profilesError) throw profilesError;

      showSuccess("Toko berhasil ditutup sementara! Sisa slot semua staf dialihkan ke angka 0 lee.");
      await fetchDashboardData(true);
    } catch (error) {
      console.error("Error Closing Siklus RLS:", error);
      showError("Gagal mengeksekusi penutupan toko karena aturan RLS menolak akses lee.");
    }
  };

  const exportDanBukaSiklus = async () => {
    if (role !== 'super') {
      showError("Akses ditolak! Fitur ekspor rekap omset dikunci murni untuk Super Admin.");
      return;
    }
    try {
      showLoading();
      if (orders.length === 0) {
        showError("Tidak ada data pesanan aktif bulan ini untuk diexport lee.");
        return;
      }

      let csvContent = "";
      csvContent += "=== LAPORAN REKAP OMSET GLOBAL TOKO ===\n";
      csvContent += "ID Order,Nama Customer,Karakter,No WA,Model Tema,Harga,Status,Admin PJ\n";
      orders.forEach(o => {
        csvContent += `${o.id},"${o.userName.replace(/"/g, '""')}",` +
                      `"${(o.characterName || '-').replace(/"/g, '""')}",` +
                      `"${o.waNumber}","${o.themeModel}","${o.price}",${o.status},"${o.adminTarget}"\n`;
      });
      csvContent += "\n\n";

      admins.forEach(admin => {
        const adminSpecificOrders = orders.filter(o => o.adminTarget.toLowerCase().trim() === admin.name.toLowerCase().trim());
        csvContent += `=== DATA REKAP LAPORAN: ${admin.name.toUpperCase()} ===\n`;
        csvContent += "ID Order,Nama Customer,Karakter,No WA,Model Tema,Harga,Status\n";
        
        if (adminSpecificOrders.length > 0) {
          adminSpecificOrders.forEach(o => {
            csvContent += `${o.id},"${o.userName.replace(/"/g, '""')}",` +
                          `"${(o.characterName || '-').replace(/"/g, '""')}",` +
                          `"${o.waNumber}","${o.themeModel}","${o.price}",${o.status}\n`;
          });
        } else {
          csvContent += "-,Tidak ada kontribusi orderan sukses di bulan ini,-,-,-,-,-\n";
        }
        csvContent += "\n";
      });

      const dateString = `${today.getFullYear()}-${today.getMonth() + 1}`;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `LAPORAN_GABUNGAN_CLOSING_${dateString}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const orderIdsToArchive = orders.map(o => o.id);
      
      const { error: archiveError } = await supabase
        .from('orders')
        .update({ is_archived: true })
        .in('id', orderIdsToArchive);

      if (archiveError) throw archiveError;

      const { error: normalStatusError } = await supabase
        .from('system_settings')
        .update({ app_status: 'NORMAL', updated_at: new Date() })
        .eq('id', 'main_config');

      if (normalStatusError) throw normalStatusError;

      showSuccess("Laporan CSV berhasil diunduh! Dashboard dibersihkan dan gembok toko resmi dibuka kembali lee.");
      await fetchDashboardData(true);
    } catch (error) {
      console.error("Error Export Siklus RLS:", error);
      showError("Terjadi kendala hak akses RLS saat memproses arsip pembukuan lee.");
    }
  };

  const updateOrderStatus = async (id, newStatus) => {
    try {
      showLoading();
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      showSuccess(`Status orderan berhasil diubah menjadi ${newStatus}!`);
      await fetchDashboardData(true);
    } catch (error) {
      console.error("Error Update Order Status RLS:", error);
      showError("Gagal memperbarui status pesanan karena aturan RLS menolak perubahan.");
    }
  };

  const updateProfile = async (key, value) => {
    try {
      if (!currentProfile) return false;
      if (appStatus === 'PRE_CLOSING' && role !== 'super') {
        showError("Input slot ditutup sementara karena toko sedang berada dalam masa pembersihan akhir bulan lee.");
        return false;
      }

      if (key === 'slot' && value > currentProfile.totalSlot) {
        showError(`Sisa slot (${value}) tidak boleh melebihi total slot (${currentProfile.totalSlot}) lee!`);
        return false;
      }
      
      const dbKey = key === 'totalSlot' ? 'total_slot' : key;
      
      const { error } = await supabase
        .from('admin_profiles')
        .update({ [dbKey]: value })
        .eq('user_id', userId || currentProfile.id);

      if (error) throw error;
      await fetchDashboardData(true);
      return true;
    } catch (error) {
      console.error("Error Update Profil Sendiri RLS:", error);
      showError("Gagal mengupdate profil toko lee.");
      return false;
    }
  };

  const updateProfileOtherAdmin = async (targetName, key, value) => {
    if (role !== 'super') {
      showError("Akses ditolak! Hanya Super Admin yang berhak memodifikasi slot staf lain lee.");
      return false;
    }
    try {
      const targetAdmin = admins.find(a => a.name === targetName);
      if (!targetAdmin) return false;

      if (key === 'slot' && value > targetAdmin.totalSlot) {
        showError(`Sisa slot (${value}) tidak boleh melebihi total slot (${targetAdmin.totalSlot}) admin ${targetName} lee!`);
        return false;
      }

      const dbKey = key === 'totalSlot' ? 'total_slot' : key;
      
      const { error } = await supabase
        .from('admin_profiles')
        .update({ [dbKey]: value })
        .eq('user_id', targetAdmin.id);

      if (error) throw error;
      await fetchDashboardData(true);
      return true;
    } catch (error) {
      console.error("Error Update Profil Staf Lain RLS:", error);
      showError("Super admin gagal mengedit profil staf akibat sensor RLS.");
      return false;
    }
  };
  
  const handleLogout = () => {
    localStorage.clear();
    navigate('/admin/login');
  };

  // 🔥 OPTIMASI RENDERING: Jangan blokir UI dengan loading-screen jika data cache memori sudah siap sedia
  if (loading && !isInitialLoaded) {
    return (
      <div className="min-h-screen bg-[#f8faff] flex justify-center items-center text-slate-400 font-bold text-xs tracking-wider animate-pulse">
        SINKRONISASI DASHBOARD INTERN LEE...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faff] p-5 font-['Inter'] pb-28">
      <header className="flex justify-between items-center mb-6 bg-white p-4 rounded-[28px] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black">
            {adminName?.charAt(0)}
          </div>
          <div>
            <h1 className="text-sm font-black text-[#0f172a]">{adminName}</h1>
            <p className="text-[10px] text-[#94a3b8] uppercase font-bold tracking-widest">{role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="text-[11px] font-bold text-red-500 bg-red-50 px-4 py-2 rounded-xl">Logout</button>
      </header>

      {/* 📋 RENDER KONTEN BERDASARKAN TAB AKTIF */}
      {currentTab === 'themes' && (
        <ManageThemes role={role} adminName={adminName} />
      )}

      {currentTab === 'profile' && (
        <div className="px-1">
          <h2 className="text-xl font-black text-[#0f172a] mb-5 px-2 tracking-tight">Pengaturan Profil</h2>
          <Profile />
        </div>
      )}

      {currentTab === 'admins' && role === 'super' && (
        <div className="px-1">
          <h2 className="text-xl font-black text-[#0f172a] mb-5 px-2 tracking-tight">Kelola Seluruh Staff</h2>
          <ManageAdminsTab 
            admins={admins} 
            updateProfileOtherAdmin={updateProfileOtherAdmin} 
            appStatus={appStatus}
          />
        </div>
      )}

      {currentTab === 'orders' && (
        role === 'super' ? (
          <SuperAdminView 
            orders={orders}
            setOrders={setOrders} 
            updateStatus={updateOrderStatus} 
            admins={admins} 
            updateProfileOtherAdmin={updateProfileOtherAdmin}
            appStatus={appStatus}
            isClosingDay={isClosingDay}
            onCloseSiklus={closeTokoSiklus}
            onExportSiklus={exportDanBukaSiklus}
          />
        ) : (
          currentProfile && (
            <AdminView 
              currentProfile={currentProfile} 
              updateProfile={updateProfile} 
              orders={orders}
              activeOrders={orders.filter(o => o.adminTarget.toLowerCase().trim() === adminName.toLowerCase().trim())} 
              updateStatus={updateOrderStatus} 
              appStatus={appStatus}
              isClosingDay={isClosingDay}
            />
          )
        )
      )}

      {/* 🗺️ DOCKING SYSTEM BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-6 left-6 right-6 bg-[#0f172a] p-4 rounded-[28px] flex justify-around shadow-2xl z-50">
        <button 
          onClick={() => setCurrentTab('orders')} 
          className={`text-[10px] font-black uppercase tracking-widest transition-colors ${currentTab === 'orders' ? 'text-white' : 'text-slate-500'}`}
        >
          Orders
        </button>
        
        {role === 'super' && (
          <button 
            onClick={() => setCurrentTab('admins')} 
            className={`text-[10px] font-black uppercase tracking-widest transition-colors ${currentTab === 'admins' ? 'text-white' : 'text-slate-500'}`}
          >
            Staff
          </button>
        )}

        <button 
          onClick={() => setCurrentTab('themes')} 
          className={`text-[10px] font-black uppercase tracking-widest transition-colors ${currentTab === 'themes' ? 'text-white' : 'text-slate-500'}`}
        >
          Katalog
        </button>

        <button 
          onClick={() => setCurrentTab('profile')} 
          className={`text-[10px] font-black uppercase tracking-widest transition-colors ${currentTab === 'profile' ? 'text-white' : 'text-slate-500'}`}
        >
          Profile
        </button>
      </nav>
    </div>
  );
};

export default Dashboard;
