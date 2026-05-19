import Swal from 'sweetalert2';

// Base style biar konsisten sama UI lu yang rounded
const Toast = Swal.mixin({
  customClass: {
    popup: 'rounded-[30px]',
    confirmButton: 'rounded-xl px-10 bg-[#2557e0] font-bold',
    cancelButton: 'rounded-xl px-10 font-bold'
  },
  buttonsStyling: true,
  confirmButtonColor: '#2557e0',
});

export const showSuccess = (adminName) => {
  return Toast.fire({
    title: 'Berhasil!',
    text: `Request tema kamu sudah terkirim ke ${adminName}. Tunggu konfirmasi selanjutnya ya!`,
    icon: 'success',
  });
};

export const showError = (message = "Terjadi kesalahan koneksi") => {
  return Toast.fire({
    title: 'Waduh, Error!',
    text: message,
    icon: 'error',
  });
};

export const showSlotFull = () => {
  return Toast.fire({
    title: 'Slot Penuh!',
    text: 'Maaf ya, admin ini baru saja menerima orderan terakhir. Coba admin lain yuk!',
    icon: 'warning',
  });
};

export const showLoading = () => {
  Toast.fire({
    title: 'Mengirim...',
    text: 'Mohon tunggu sebentar ya',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
};
