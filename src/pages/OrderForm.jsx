import React, { useState } from "react";
import { supabase } from "../utils/supabaseClient"; // 🌟 Impor Supabase Client
import { showSuccess, showError, showLoading } from "../utils/alerts";

const OrderForm = ({ selectedAdmin, selectedTheme, onBack, onSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State input data customer
    const [customerName, setCustomerName] = useState("");
    const [characterName, setCharacterName] = useState("");
    const [whatsappNumber, setWhatsappNumber] = useState("");

    // Destrukturisasi properti objek aman kiriman dari UserApp induk
    const adminName = selectedAdmin?.name || "Unknown Admin";
    const adminId = selectedAdmin?.id; // 🌟 Ambil UUID/ID Auth user admin target
    const themeTitle = selectedTheme?.title || "Belum memilih tema";
    const themePrice = selectedTheme?.price || "0K";

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        // Validasi ekstra di sisi klien
        if (!customerName.trim() || !characterName.trim() || !whatsappNumber.trim()) {
            showError("Tolong isi semua data pribadi kamu lee!");
            return;
        }

        try {
            setIsSubmitting(true);
            showLoading();

            // =========================================================================
            // LAKUKAN PENGECEKAN KUOTA SLOT TERAKHIR (ANTI-RACE CONDITION)
            // =========================================================================
            const { data: latestProfile, error: profileCheckError } = await supabase
                .from("admin_profiles")
                .select("slot")
                .eq("user_id", adminId)
                .single();

            if (profileCheckError) throw profileCheckError;

            if (!latestProfile || latestProfile.slot <= 0) {
                showError(`Waduh telat bro, slot orderan di ${adminName} barusan aja penuh! Silahkan kembali pilih admin lain lee.`);
                setIsSubmitting(false);
                return;
            }

            // =========================================================================
            // 1. TEMBAK DATA ORDER BARU LANGSUNG KE TABEL SUPABASE ORDERS
            // =========================================================================
            const { error: insertError } = await supabase
                .from("orders")
                .insert([{
                    customer_name: customerName.trim(),
                    character_name: characterName.trim(),
                    whatsapp_number: whatsappNumber.trim(),
                    theme_title: themeTitle,
                    theme_price: themePrice,
                    status: "pending",     // Default status masuk antrean
                    admin_id: adminId,      // Relasi foreign key penanggung jawab admin
                    is_archived: false      // Berada di dashboard aktif, belum tutup buku
                }]);

            if (insertError) throw insertError;

            // =========================================================================
            // 2. POTONG KUOTA SLOT ADMIN YANG BERSANGKUTAN SECARA OTOMATIS (SLOT - 1)
            // =========================================================================
            const { error: updateSlotError } = await supabase
                .from("admin_profiles")
                .update({ slot: latestProfile.slot - 1 })
                .eq("user_id", adminId);

            if (updateSlotError) throw updateSlotError;

            // =========================================================================
            // 3. SELESAI & TRIGER NOTIFIKASI SUKSES (TANPA HARD REFRESH)
            // =========================================================================
            showSuccess(adminName).then((result) => {
                if (result.isConfirmed) {
                    // Bersihkan state input form lokal agar tidak nyangkut
                    setCustomerName("");
                    setCharacterName("");
                    setWhatsappNumber("");
                    setIsSubmitting(false);

                    // 🔥 Pemicu balik ke Step 1 & sinkronisasi data slot baru di UserApp.jsx
                    if (onSuccess) {
                        onSuccess();
                    }
                }
            });

        } catch (error) {
            console.error("Supabase Database Transaksi Error:", error);
            showError("Gagal mengirim request order ke server database, coba lagi lee.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-[400px] animate-fade-in text-center pb-10">
            <span className="bg-[#ebf1ff] text-[#4a69bd] px-4 py-1 rounded-full text-[12px] font-semibold tracking-wider">
                QiiThemes
            </span>
            <h1 className="text-3xl font-extrabold text-[#0f172a] mt-4 leading-tight">
                Request Tema Custom
            </h1>
            <p className="text-[13px] text-[#94a3b8] mt-2 px-4 leading-relaxed">
                Isi data di bawah untuk memesan tema dari{" "}
                <span className="text-[#2557e0] font-bold">{adminName}</span>.
            </p>

            <div className="bg-white rounded-[40px] p-8 mt-8 shadow-[0_20px_50px_rgba(188,204,255,0.4)] text-left border border-white/50">
                <form className="space-y-5" onSubmit={handleSubmit}>
                    
                    {/* Input Nama Customer */}
                    <div>
                        <label className="block text-[14px] font-bold text-[#0f172a] mb-2 ml-1">
                            Nama Lengkap
                        </label>
                        <input
                            required
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full bg-[#f3f4f6] p-4 rounded-2xl outline-none text-[#4b5563] focus:ring-2 focus:ring-[#2557e0]/20 transition-all placeholder:text-slate-300"
                            placeholder="Masukkan nama kamu"
                        />
                    </div>

                    {/* Input Model Tema (Readonly) */}
                    <div>
                        <label className="block text-[14px] font-bold text-[#0f172a] mb-2 ml-1">
                            Model Tema (Terkunci)
                        </label>
                        <input
                            type="text"
                            readOnly
                            value={themeTitle}
                            className="w-full bg-[#f8fafc] p-4 rounded-2xl text-[#94a3b8] font-bold border border-dashed border-[#cbd5e1] cursor-not-allowed bg-slate-50/50"
                        />
                    </div>

                    {/* Input Harga Tema (Readonly/Lock) */}
                    <div>
                        <label className="block text-[14px] font-bold text-[#0f172a] mb-2 ml-1">
                            Harga Tema (Terkunci)
                        </label>
                        <input
                            type="text"
                            readOnly
                            value={themePrice}
                            className="w-full bg-[#f8fafc] p-4 rounded-2xl text-blue-600 font-extrabold border border-dashed border-[#cbd5e1] cursor-not-allowed bg-slate-50/50"
                        />
                    </div>

                    {/* Input Karakter */}
                    <div>
                        <label className="block text-[14px] font-bold text-[#0f172a] mb-2 ml-1">
                            Nama Karakter / Anime
                        </label>
                        <input
                            required
                            type="text"
                            value={characterName}
                            onChange={(e) => setCharacterName(e.target.value)}
                            className="w-full bg-[#f3f4f6] p-4 rounded-2xl outline-none text-[#4b5563] focus:ring-2 focus:ring-[#2557e0]/20 transition-all placeholder:text-slate-300"
                            placeholder="Contoh: Makima, Gojo Satoru"
                        />
                    </div>

                    {/* Input WhatsApp */}
                    <div>
                        <label className="block text-[14px] font-bold text-[#0f172a] mb-2 ml-1">
                            No WhatsApp Aktif
                        </label>
                        <input
                            required
                            type="text"
                            value={whatsappNumber}
                            onChange={(e) => setWhatsappNumber(e.target.value)}
                            className="w-full bg-[#f3f4f6] p-4 rounded-2xl outline-none text-[#4b5563] focus:ring-2 focus:ring-[#2557e0]/20 transition-all placeholder:text-slate-300"
                            placeholder="Contoh: 081234567890"
                        />
                    </div>

                    {/* Tombol Navigasi Kendali */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onBack}
                            disabled={isSubmitting}
                            className="flex-1 border-2 border-[#e2e8f0] text-[#94a3b8] py-4 rounded-full font-bold active:scale-95 transition-all disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`flex-1 text-white py-4 rounded-full font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center
                                ${isSubmitting ? 'bg-slate-400 shadow-none' : 'bg-[#2557e0] shadow-blue-200'}`}
                        >
                            {isSubmitting ? 'Mengirim...' : 'Kirim Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OrderForm;
