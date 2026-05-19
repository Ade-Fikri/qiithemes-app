import React, { useState, useEffect } from "react";
import AdminCard from "../components/ui/AdminCard";
import OrderForm from "./OrderForm";
import { supabase } from "../utils/supabaseClient";
import { showError } from "../utils/alerts";

export default function UserApp() {
    const [step, setStep] = useState(1);
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [selectedTheme, setSelectedTheme] = useState(null);
    const [loading, setLoading] = useState(true);

    // State Data Database Real-time
    const [admins, setAdmins] = useState([]);
    const [displayedThemes, setDisplayedThemes] = useState([]);
    const [appStatus, setAppStatus] = useState("NORMAL"); // 🌟 Tambah state pantau gembok toko

    // =========================================================================
    // 1. FETCH STATUS TOKO & DAFTAR ADMIN AKTIF
    // =========================================================================
    const fetchInitialData = async () => {
        try {
            setLoading(true);

            // A. Cek Status Aplikasi Global dari system_settings
            const { data: settingsData } = await supabase
                .from("system_settings")
                .select("app_status")
                .eq("id", "main_config")
                .single();

            if (settingsData) {
                setAppStatus(settingsData.app_status);
            }

            // B. Ambil data profil toko gabung dengan data login user
            const { data: profilesData, error: profilesError } =
                await supabase.from("admin_profiles").select(`
                    user_id,
                    specialist,
                    status,
                    slot,
                    total_slot,
                    users (name, avatar)
                `);

            if (profilesError) throw profilesError;

            const formattedAdmins = profilesData.map(item => ({
                id: item.user_id, // 🌟 Gunakan user_id asli sebagai referensi foreign key relasi
                name: item.users?.name || "Unknown Admin",
                specialist: item.specialist,
                status: item.status,
                slot: item.slot,
                totalSlot: item.total_slot,
                avatar: item.users?.avatar || "https://via.placeholder.com/90"
            }));

            setAdmins(formattedAdmins);
        } catch (error) {
            console.error("Gagal memuat data awal:", error);
            showError("Gagal mengambil data dari server lee.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    // =========================================================================
    // 2. FETCH KATALOG TEMA TERFILTER PER ADMIN (UNTUK STEP 2)
    // =========================================================================
    const fetchCatalogForAdmin = async adminName => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from("admin_catalogs")
                .select(
                    `
                    themes (*),
                    users!inner (name)
                `
                )
                .eq("users.name", adminName);

            if (error) throw error;

            const filteredThemes = (data || []).map(item => ({
                id: item.themes.id,
                title: item.themes.title,
                tag: item.themes.tag,
                price: item.themes.price,
                img: item.themes.img,
                previewLink: item.themes.preview_link
            }));

            setDisplayedThemes(filteredThemes);
        } catch (error) {
            console.error("Gagal memuat etalase tema:", error);
            showError("Gagal memuat varian tema admin ini lee.");
        } finally {
            setLoading(false);
        }
    };

    const handleImageClick = (previewUrl, title) => {
        if (previewUrl && previewUrl.trim() !== "") {
            window.open(previewUrl, "_blank", "noopener,noreferrer");
        } else {
            alert(`Video review untuk tema "${title}" belum tersedia lee.`);
        }
    };

    if (loading && step === 1) {
        return (
            <div className="min-h-screen bg-[#f5f8ff] flex justify-center items-center text-slate-400 font-bold text-xs tracking-wider animate-pulse">
                MENYIAPKAN HALAMAN REQUEST TEMA LEE...
            </div>
        );
    }

    // 🚨 KONDISI TOKO SEDANG TUTUP BUKU (PRE_CLOSING BANNER SCREEN)
    if (appStatus === "PRE_CLOSING") {
        return (
            <div className="min-h-screen bg-[#f5f8ff] flex justify-center items-center p-6 font-['Inter']">
                <div className="w-full max-w-[400px] bg-white p-8 rounded-[40px] shadow-xl text-center border border-slate-100 animate-fade-in">
                    <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 animate-bounce">
                        ⏳
                    </div>
                    <h1 className="text-xl font-black text-[#0f172a] tracking-tight">
                        Toko Tutup Sementara
                    </h1>
                    <p className="text-[10px] text-amber-600 bg-amber-50 inline-block px-3 py-1 rounded-full font-black uppercase mt-2 tracking-widest">
                        Masa Akhir Bulan
                    </p>
                    <p className="text-xs text-slate-400 mt-4 leading-relaxed font-medium">
                        Halo bro/sist, saat ini toko kami sedang dalam proses
                        rekapitulasi pembukuan bulanan (Closing Day). Request
                        orderan baru akan dibuka kembali secepatnya lee!
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f5f8ff] flex justify-center p-[40px_20px] font-['Inter']">
            {/* TAHAP 1: PILIH ADMIN */}
            {step === 1 && (
                <div className="w-full max-w-[400px] text-center animate-fade-in">
                    <header className="mb-10 text-center">
                        <span className="bg-[#ebf1ff] text-[#4a69bd] px-[16px] py-[6px] rounded-full text-[14px] font-semibold">
                            QiiThemes
                        </span>
                        <h1 className="text-[42px] font-extrabold text-[#0f172a] mt-4 tracking-tighter leading-tight">
                            Request Tema
                        </h1>
                        <p className="text-[20px] text-[#64748b] mt-1">
                            Total Launcher
                        </p>
                        <p className="text-[15px] text-[#94a3b8] mt-4 px-4 leading-relaxed">
                            Silahkan pilih admin yang ingin kamu order custom
                            tema Android favoritmu.
                        </p>
                    </header>

                    {admins.map((admin, index) => {
                        const isFull = admin.slot <= 0; // Proteksi slot habis
                        return (
                            <AdminCard
                                key={index}
                                {...admin}
                                onOrder={() => {
                                    if (isFull) {
                                        alert(
                                            `Slot orderan ${admin.name} sudah penuh bro, silahkan pilih admin lain lee.`
                                        );
                                        return;
                                    }
                                    setSelectedAdmin(admin); // 🌟 Simpan objek admin utuh (termasuk id dan name)
                                    fetchCatalogForAdmin(admin.name);
                                    setStep(2);
                                }}
                            />
                        );
                    })}
                    <div className="w-[60%] h-[4px] bg-gradient-to-r from-transparent via-[#2557e0] to-transparent mx-auto mt-10 rounded-full opacity-30"></div>
                </div>
            )}

            {/* TAHAP 2: KATALOG MODEL */}
            {step === 2 && (
                <div className="w-full max-w-[400px] text-center animate-fade-in">
                    <span className="bg-[#ebf1ff] text-[#4a69bd] px-4 py-1 rounded-full text-xs font-semibold uppercase tracking-widest">
                        Katalog {selectedAdmin?.name}
                    </span>
                    <h1 className="text-3xl font-extrabold text-[#0f172a] mt-4">
                        Pilih Model Tema
                    </h1>

                    <button
                        onClick={() => {
                            setSelectedAdmin(null);
                            setStep(1);
                        }}
                        className="mt-6 mb-8 text-[#94a3b8] font-bold text-sm flex items-center justify-center gap-2 mx-auto hover:text-[#2557e0] transition-colors"
                    >
                        ← Kembali ke Pilih Admin
                    </button>

                    <div className="grid grid-cols-2 gap-4">
                        {displayedThemes.length > 0 ? (
                            displayedThemes.map(model => (
                                <div
                                    key={model.id}
                                    className="bg-white p-3 rounded-[30px] shadow-[0_8px_20px_rgba(188,204,255,0.1)] border border-[#f1f5f9] flex flex-col justify-between relative"
                                >
                                    <div
                                        onClick={() =>
                                            handleImageClick(
                                                model.previewLink,
                                                model.title
                                            )
                                        }
                                        className="relative overflow-hidden rounded-[20px] aspect-[9/16] bg-slate-50 cursor-pointer group"
                                        title="Klik untuk melihat video review tema ini bro"
                                    >
                                        <img
                                            src={model.img}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            alt={model.title}
                                            onError={e => {
                                                e.target.src =
                                                    "https://via.placeholder.com/360x640?text=Image+Not+Found";
                                            }}
                                        />
                                        {model.previewLink && (
                                            <div className="absolute bottom-2 right-2 bg-black/40 text-white backdrop-blur-md p-1.5 rounded-lg border border-white/10 opacity-80 group-hover:opacity-100 transition-opacity">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-3 w-3"
                                                    fill="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path d="M8 5v14l11-7z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-left mt-4 px-1 flex-1 flex flex-col justify-between">
                                        <div>
                                            <span className="text-[10px] bg-blue-50 text-blue-500 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                                {model.tag}
                                            </span>
                                            <h3 className="text-[14px] font-bold text-[#0f172a] mt-1 line-clamp-1">
                                                {model.title}
                                            </h3>
                                            <p className="text-[14px] text-[#94a3b8] font-medium">
                                                Mulai{" "}
                                                <span className="text-[#2557e0] font-bold">
                                                    {model.price}
                                                </span>
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => {
                                                setSelectedTheme(model);
                                                setStep(3);
                                            }}
                                            className="w-full bg-[#2557e0] text-white py-3 rounded-xl mt-4 text-[13px] font-bold active:scale-95 transition-all shadow-md shadow-blue-100"
                                        >
                                            Pilih
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-2 text-center text-slate-400 italic text-sm py-12 bg-white rounded-[30px] border border-slate-100 px-4">
                                Admin ini belum memasukkan varian tema ke
                                etalasenya lee.
                            </div>
                        )}
                    </div>
                    <div className="h-10"></div>
                </div>
            )}

            {/* TAHAP 3: FORM ORDER */}
            {step === 3 && (
                <OrderForm
                    selectedAdmin={selectedAdmin}
                    selectedTheme={selectedTheme}
                    onBack={() => setStep(2)}
                    onSuccess={() => {
                        fetchInitialData(); // Ambil data slot ter-update dari DB
                        setSelectedAdmin(null);
                        setSelectedTheme(null);
                        setStep(1); // Balik ke halaman pilih admin
                    }}
                />
            )}
        </div>
    );
}
