// --- FILE: src/components/ui/Modal.tsx (UPDATED) ---
// Deskripsi: Diperbarui dengan styling untuk menangani konten yang panjang (overflow).

import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) return null;

  return (
    // Lapisan luar (overlay gelap)
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      
      {/* Kontainer Modal Utama */}
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
        
        {/* Header Modal (Tidak akan scroll) */}
        <div className="flex-shrink-0 flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>
        
        {/* Body Modal (Area yang bisa di-scroll) */}
        <div className="p-4 overflow-y-auto">
          {children}
        </div>

      </div>
    </div>
  );
};
