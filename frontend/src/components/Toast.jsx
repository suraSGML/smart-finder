import React from 'react';
import toast from 'react-hot-toast';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { motion } from 'framer-motion';

// Custom toast functions
export const showSuccess = (message, duration = 3000) => {
  toast.custom((t) => (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className="bg-green-50 dark:bg-green-900 border-l-4 border-green-500 p-4 rounded-lg shadow-lg flex items-center gap-3"
    >
      <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
      <span className="text-green-800 dark:text-green-100 font-medium">{message}</span>
      <button
        onClick={() => toast.dismiss(t.id)}
        className="ml-auto text-green-500 hover:text-green-700"
      >
        <X size={18} />
      </button>
    </motion.div>
  ), { duration });
};

export const showError = (message, duration = 4000) => {
  toast.custom((t) => (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className="bg-red-50 dark:bg-red-900 border-l-4 border-red-500 p-4 rounded-lg shadow-lg flex items-center gap-3"
    >
      <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
      <span className="text-red-800 dark:text-red-100 font-medium">{message}</span>
      <button
        onClick={() => toast.dismiss(t.id)}
        className="ml-auto text-red-500 hover:text-red-700"
      >
        <X size={18} />
      </button>
    </motion.div>
  ), { duration });
};

export const showInfo = (message, duration = 3000) => {
  toast.custom((t) => (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className="bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-500 p-4 rounded-lg shadow-lg flex items-center gap-3"
    >
      <Info className="text-blue-500 flex-shrink-0" size={20} />
      <span className="text-blue-800 dark:text-blue-100 font-medium">{message}</span>
      <button
        onClick={() => toast.dismiss(t.id)}
        className="ml-auto text-blue-500 hover:text-blue-700"
      >
        <X size={18} />
      </button>
    </motion.div>
  ), { duration });
};

const toastFunctions = { showSuccess, showError, showInfo };
export default toastFunctions;
