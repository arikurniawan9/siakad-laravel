import { Fragment } from 'react';
import Modal from './Modal';
import DangerButton from './DangerButton';
import SecondaryButton from './SecondaryButton';

export default function ConfirmationModal({ 
    show = false, 
    maxWidth = 'md', 
    onClose = () => {}, 
    onConfirm = () => {}, 
    title = 'Konfirmasi Hapus', 
    message = 'Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.',
    confirmText = 'Hapus Data',
    cancelText = 'Batal',
    processing = false 
}) {
    return (
        <Modal show={show} maxWidth={maxWidth} onClose={onClose}>
            <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-rose-100 rounded-full">
                    <svg className="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                </div>

                <div className="mt-4 text-center">
                    <h3 className="text-lg font-bold text-slate-900">
                        {title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                        {message}
                    </p>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center sm:gap-3">
                    <SecondaryButton onClick={onClose} disabled={processing}>
                        {cancelText}
                    </SecondaryButton>

                    <DangerButton onClick={onConfirm} processing={processing}>
                        {confirmText}
                    </DangerButton>
                </div>
            </div>
        </Modal>
    );
}
