import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { supabase } from '../../utils/supabaseClient'; // 🌟 Sambungkan koneksi database Supabase client

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false); // State loading biar tombol gak di-spam
    const navigate = useNavigate();

    // Cek jika sudah login, langsung lempar ke dashboard
    useEffect(() => {
        const auth = localStorage.getItem('isLoggedIn');
        if (auth === 'true') {
            navigate('/admin');
        }
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (isLoggingIn) return;

        try {
            setIsLoggingIn(true);

            // 🌟 PANGGIL MESIN VERIFIKASI HASH BCRYPT DI DATABASE LEWAT RPC
            const { data: foundUser, error } = await supabase
                .rpc('verify_admin_login', {
                    input_username: username.trim(),
                    input_password: password
                })
                .maybeSingle(); // Mengambil satu data objek jika cocok

            if (error) throw error;

            if (foundUser) {
                // 🌟 2. Simpan session real-time dari database ke LocalStorage
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userRole', foundUser.role); // 'super' atau 'admin'
                localStorage.setItem('adminName', foundUser.name);
                localStorage.setItem('adminId', foundUser.id);

                // Alert Sukses
                Swal.fire({
                    icon: 'success',
                    title: `Halo, Admin ${foundUser.name}!`,
                    text: 'Otentikasi hash database berhasil, mengalihkan...',
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: {
                        popup: 'rounded-[30px]',
                    }
                }).then(() => {
                    navigate('/admin');
                });
            } else {
                // Alert Gagal jika hash password atau username gak klop di database
                Swal.fire({
                    icon: 'error',
                    title: 'Akses Ditolak!',
                    text: 'Username atau Password salah, cek lagi lee!',
                    confirmButtonColor: '#2557e0',
                    customClass: {
                        popup: 'rounded-[30px]',
                        confirmButton: 'rounded-xl px-10'
                    }
                });
            }
        } catch (error) {
            console.error("Login RPC Supabase Error:", error);
            Swal.fire({
                icon: 'warning',
                title: 'Gangguan Server!',
                text: 'Gagal menghubungkan atau mencocokkan kredensial keamanan lee.',
                confirmButtonColor: '#2557e0',
                customClass: { popup: 'rounded-[30px]' }
            });
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f5f8ff] flex items-center justify-center p-6 font-['Inter']">
            <div className="w-full max-w-[400px] animate-fade-in">
                {/* Logo / Badge */}
                <div className="text-center mb-8">
                    <div className="inline-block bg-white p-4 rounded-[25px] shadow-sm mb-4">
                        <div className="w-12 h-12 bg-[#2557e0] rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-200">
                            Q
                        </div>
                    </div>
                    <h1 className="text-3xl font-black text-[#0f172a] tracking-tight">Admin Panel</h1>
                    <p className="text-[#94a3b8] text-sm mt-2 font-medium">
                        Khusus untuk tim <span className="text-[#2557e0]">QiiThemes</span>
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-[40px] p-10 shadow-[0_20px_50px_rgba(188,204,255,0.4)] border border-white">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-[13px] font-bold text-[#0f172a] mb-2 ml-1 uppercase tracking-wider">
                                Username
                            </label>
                            <input 
                                required
                                type="text" 
                                className="w-full bg-[#f3f4f6] p-4 rounded-2xl outline-none border-2 border-transparent focus:border-[#2557e0]/20 focus:bg-white transition-all text-[#475569] font-medium"
                                placeholder="Input username lu"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-[13px] font-bold text-[#0f172a] mb-2 ml-1 uppercase tracking-wider">
                                Password
                            </label>
                            <input 
                                required
                                type="password" 
                                className="w-full bg-[#f3f4f6] p-4 rounded-2xl outline-none border-2 border-transparent focus:border-[#2557e0]/20 focus:bg-white transition-all text-[#475569] font-medium"
                                placeholder="Input password lu"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <button 
                            type="submit"
                            disabled={isLoggingIn}
                            className={`w-full text-white py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-all mt-4 ${
                                isLoggingIn ? 'bg-slate-400 shadow-none cursor-not-allowed' : 'bg-[#2557e0] shadow-blue-200 hover:bg-[#1e46b3]'
                            }`}
                        >
                            {isLoggingIn ? 'Memeriksa Berkas...' : 'Masuk ke Dashboard'}
                        </button>
                    </form>
                </div>

                {/* Footer Login */}
                <p className="text-center text-[#94a3b8] text-xs mt-8 font-medium">
                    &copy; 2026 QiiThemes Digital Solution
                </p>
            </div>
        </div>
    );
};

export default Login;
