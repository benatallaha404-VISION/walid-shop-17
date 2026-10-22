// components/Toast.jsx
import React from 'react';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

const icons = {
  success: <CheckCircle size={16} />,
  error: <AlertCircle size={16} />,
  info: <Info size={16} />,
};

export default function ToastContainer() {
  const { toasts } = useApp();

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          {icons[t.type]}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
