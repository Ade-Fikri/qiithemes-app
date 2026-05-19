import React, { useState } from 'react';
import { OrderList } from './AdminView';
import StatsTab from './super/StatsTab';
import CustomerTab from './super/CustomerTab';
import ArchiveTab from './super/ArchiveTab'; // 🌟 Impor komponen arsip modular baru

const SuperAdminView = ({ 
  orders, 
  setOrders, 
  updateStatus, 
  admins, 
  appStatus,
  isClosingDay,
  onCloseSiklus,
  onExportSiklus
}) => {
  const [filterName, setFilterName] = useState('All');
  const [activeTab, setActiveTab] = useState('stats');

  const filteredOrders = filterName === 'All' 
    ? orders 
    : orders.filter(o => o.adminTarget?.toLowerCase().trim() === filterName?.toLowerCase().trim());

  const hasUnfinishedOrders = orders.some(o => o.status === 'pending' || o.status === 'proses');

  return (
    <div className="animate-fade-in font-['Inter'] relative">
      
      {/* 1. SLIDER FILTER ADMIN */}
      <div className="mb-6 flex overflow-x-auto gap-2 pb-2 scrollbar-hide px-2">
        <button
          onClick={() => setFilterName('All')}
          className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
            filterName === 'All' ? 'bg-[#2557e0] text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'
          }`}
        >
          All
        </button>
        {admins.map(a => (
          <button
            key={a.id}
            onClick={() => setFilterName(a.name)}
            className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              filterName === a.name ? 'bg-[#2557e0] text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'
            }`}
          >
            {a.name.replace('Admin ', '')}
          </button>
        ))}
      </div>

      {/* 2. TAB MENU NAVIGATION (FOKUS DATA & ARSIP) */}
      <div className="flex bg-slate-200/50 p-1 rounded-2xl mb-6 mx-2 border border-slate-200/30">
        {[
          { id: 'stats', label: 'Statistik' },
          { id: 'orders', label: 'Orders' },
          { id: 'customers', label: 'Customer' },
          { id: 'archive', label: 'Arsip Buku' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-tight rounded-xl transition-all ${
              activeTab === tab.id ? 'bg-white text-[#2557e0] shadow-sm' : 'text-slate-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. KONTEN ROUTER BERDASARKAN TAB YANG AKTIF */}
      {activeTab === 'stats' && (
        <StatsTab orders={orders} filterName={filterName} />
      )}

      {activeTab === 'orders' && (
        <div className="px-2">
          <div className="mb-4">
            {isClosingDay && appStatus === 'NORMAL' && (
              <button
                onClick={onCloseSiklus}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white p-4 rounded-2xl text-[11px] font-black uppercase tracking-wider shadow-md transition-all active:scale-95"
              >
                🚨 Masuk Akhir Bulan: Klik Untuk Tutup Toko Sementara
              </button>
            )}

            {appStatus === 'PRE_CLOSING' && hasUnfinishedOrders && (
              <div className="bg-slate-800 text-slate-200 p-4 rounded-2xl text-[11px] font-bold text-center border border-slate-700 shadow-inner">
                ⏳ Toko Ditutup Sementara! Menunggu anak-anak merampungkan sisa orderan gantung menjadi sukses untuk membuka tombol export lee...
              </div>
            )}

            {appStatus === 'PRE_CLOSING' && !hasUnfinishedOrders && orders.length > 0 && (
              <button
                onClick={onExportSiklus}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-2xl text-[11px] font-black uppercase tracking-wider shadow-lg transition-all animate-bounce"
              >
                📥 Semua Kerja Kelar! Ambil Berkas CSV & Buka Toko Kembali
              </button>
            )}
          </div>

          <h2 className="text-xl font-black text-[#0f172a] mb-4 px-1 tracking-tight">
            {filterName === 'All' ? 'Semua Pesanan' : `Pesanan ${filterName}`}
          </h2>
          <OrderList 
            orders={filteredOrders} 
            updateStatus={updateStatus} 
            appStatus={appStatus} 
          />
        </div>
      )}

      {activeTab === 'customers' && (
        <CustomerTab orders={orders} setOrders={setOrders} />
      )}

      {/* 🌟 PEMANGGILAN KOMPONEN ARSIP MODULAR */}
      {activeTab === 'archive' && (
        <ArchiveTab admins={admins} />
      )}

    </div>
  );
};

export default SuperAdminView;
