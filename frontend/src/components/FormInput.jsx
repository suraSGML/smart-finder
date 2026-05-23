import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const FormInput = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  success,
  required = false,
  pattern,
  minLength,
  maxLength,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const { t } = useTranslation();

  const handleBlur = (e) => {
    setTouched(true);
    onBlur?.(e);
  };

  const showError = touched && error;
  const showSuccess = touched && !error && success;

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <motion.input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          pattern={pattern}
          minLength={minLength}
          maxLength={maxLength}
          className={`w-full px-4 py-2 border-2 rounded-lg transition-all focus:outline-none dark:bg-gray-700 dark:text-gray-100 ${
            showError
              ? 'border-red-500 focus:border-red-600'
              : showSuccess
              ? 'border-green-500 focus:border-green-600'
              : isFocused
              ? 'border-blue-500 focus:border-blue-600'
              : 'border-gray-300 dark:border-gray-600'
          }`}
          animate={{
            boxShadow: isFocused
              ? '0 0 0 3px rgba(59, 130, 246, 0.1)'
              : 'none',
          }}
          {...props}
        />

        {showError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            <AlertCircle size={20} className="text-red-500" />
          </motion.div>
        )}

        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            <CheckCircle size={20} className="text-green-500" />
          </motion.div>
        )}
      </div>

      {showError && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-sm mt-1 flex items-center gap-1"
        >
          <AlertCircle size={14} />
          {error}
        </motion.p>
      )}

      {showSuccess && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-green-500 text-sm mt-1 flex items-center gap-1"
        >
          <CheckCircle size={14} />
          Looks good!
        </motion.p>
      )}
    </div>
  );
};

export default FormInput;
