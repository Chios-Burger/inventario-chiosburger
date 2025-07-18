import React from 'react';
import { notificationSystem } from '../utils/notificationSystem';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
  const pendingNotifications = notificationSystem.getPendingNotifications();

  const handleConfirm = () => {
    notificationSystem.clearNotifications();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Nuevos Inventarios Completados
          </h2>
          
          <p className="text-gray-600 mb-4">
            Los siguientes locales han completado su inventario:
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            {pendingNotifications.map((bodega, index) => (
              <div key={index} className="text-gray-700 font-medium py-1">
                ✓ {bodega}
              </div>
            ))}
          </div>
          
          <button
            onClick={handleConfirm}
            className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            He revisado los inventarios
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;