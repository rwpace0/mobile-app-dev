import { useState } from 'react';

export const useAlertModal = () => {
  const [alertState, setAlertState] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'error', // 'error', 'warning', 'info', 'success'
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: false,
    onConfirm: null,
    onCancel: null,
  });

  const showAlert = ({
    title,
    message,
    type = 'error',
    confirmText = 'OK',
    cancelText = 'Cancel',
    showCancel = false,
    onConfirm = null,
    onCancel = null,
  }) => {
    setAlertState({
      visible: true,
      title,
      message,
      type,
      confirmText,
      cancelText,
      showCancel,
      onConfirm,
      onCancel,
    });
  };

  const hideAlert = () => {
    setAlertState(prev => ({ ...prev, visible: false }));
  };

  const showError = (title, message, options = {}) => {
    showAlert({
      title,
      message,
      type: 'error',
      ...options,
    });
  };

  const showWarning = (title, message, options = {}) => {
    showAlert({
      title,
      message,
      type: 'warning',
      ...options,
    });
  };

  const showInfo = (title, message, options = {}) => {
    showAlert({
      title,
      message,
      type: 'info',
      ...options,
    });
  };

  const showSuccess = (title, message, options = {}) => {
    showAlert({
      title,
      message,
      type: 'success',
      ...options,
    });
  };

  return {
    alertState,
    showAlert,
    hideAlert,
    showError,
    showWarning,
    showInfo,
    showSuccess,
  };
}; 