import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Notification from '../components/Notification/Notification';

const NotificationContext = createContext(null);

function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const timeoutRefs = useRef({});

  const removeNotification = useCallback(function(id) {
    setNotifications(function(prev) {
      return prev.filter(function(item) {
        return item.id !== id;
      });
    });

    if (timeoutRefs.current[id]) {
      clearTimeout(timeoutRefs.current[id]);
      delete timeoutRefs.current[id];
    }
  }, []);

  const notify = useCallback(function(message, type, durationMs) {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const safeType = type || 'info';
    const timeoutDuration = durationMs || 4000;

    setNotifications(function(prev) {
      return [...prev, { id, message, type: safeType }];
    });

    timeoutRefs.current[id] = setTimeout(function() {
      removeNotification(id);
    }, timeoutDuration);
  }, [removeNotification]);

  const showSuccess = useCallback(function(message, durationMs) {
    notify(message, 'success', durationMs);
  }, [notify]);

  const showError = useCallback(function(message, durationMs) {
    notify(message, 'error', durationMs);
  }, [notify]);

  const showInfo = useCallback(function(message, durationMs) {
    notify(message, 'info', durationMs);
  }, [notify]);

  useEffect(function() {
    function handleGlobalNetworkError(event) {
      const message = event && event.detail && event.detail.message
        ? event.detail.message
        : 'We are having trouble connecting right now. Please try again.';
      showError(message);
    }

    window.addEventListener('app:network-error', handleGlobalNetworkError);
    return function() {
      window.removeEventListener('app:network-error', handleGlobalNetworkError);
    };
  }, [showError]);

  const value = useMemo(function() {
    return {
      notify,
      showSuccess,
      showError,
      showInfo
    };
  }, [notify, showSuccess, showError, showInfo]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="notification-stack" aria-live="polite" aria-atomic="true">
        {notifications.map(function(item) {
          return (
            <Notification
              key={item.id}
              id={item.id}
              type={item.type}
              message={item.message}
              onClose={removeNotification}
            />
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
}

function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}

export { NotificationProvider, useNotification };