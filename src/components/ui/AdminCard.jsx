import React from "react";

const AdminCard = ({ name, specialist, status, slot, totalSlot, avatar, onOrder }) => {
    const isOnline = status.toLowerCase() === "online";
    // Jika slot 0 atau kurang, maka penuh
    const isFull = slot <= 0; 
    const isDisabled = isFull || !isOnline;

    return (
        <div className={`bg-white rounded-[30px] p-[25px] mb-[25px] shadow-[0_10px_30px_rgba(188,204,255,0.3)] text-left transition-all duration-300 ${isFull ? "opacity-75" : "opacity-100"}`}>
            <div className="flex gap-[15px] items-start">
                <img src={avatar} alt={name} className="w-[90px] h-[90px] rounded-[12px] object-cover bg-slate-100" />
                <div className="admin-info flex-1">
                    <h2 className="text-[24px] font-bold text-[#0f172a] leading-tight">{name}</h2>
                    <p className="text-[13px] text-[#94a3b8] my-[4px] leading-[1.3]">{specialist}</p>
                    <span className={`text-[12px] font-semibold flex items-center gap-[5px] ${isOnline ? "text-[#2ecc71]" : "text-[#94a3b8]"}`}>
                        <span className={`w-[8px] h-[8px] rounded-full ${isOnline ? "bg-[#2ecc71] shadow-[0_0_8px_#2ecc71]" : "bg-[#94a3b8]"}`}></span>
                        {isOnline ? "Online" : "Offline"}
                    </span>
                </div>
            </div>

            <div className="h-[1px] bg-[#f1f5f9] my-[20px]"></div>

            <div className="flex justify-between text-[14px] text-[#94a3b8] font-medium mb-[25px]">
                <span>Slot tersedia</span>
                <span className={`font-bold ${isFull ? "text-red-500" : "text-[#0f172a]"}`}>
                    {slot} / {totalSlot} Slot
                </span>
            </div>

            <button
                onClick={onOrder}
                disabled={isDisabled}
                className={`w-full py-[15px] rounded-[20px] text-[18px] font-bold transition-all duration-200
                ${isDisabled ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" : "bg-[#2557e0] text-white active:scale-[0.98] shadow-lg shadow-blue-200 hover:bg-[#1d46b8]"}`}
            >
                {isFull ? "Slot Penuh" : !isOnline ? "Sedang Offline" : "Order"}
            </button>
        </div>
    );
};

export default AdminCard;
