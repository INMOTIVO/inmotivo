import { toast } from 'sonner';
import { formatCOP } from './mapHelpers';

interface NotificationState {
  alertedIds: Set<string>;
  lastCleanup: number;
}

const state: NotificationState = {
  alertedIds: new Set(),
  lastCleanup: Date.now()
};

const ALERT_EXPIRY = 15 * 60 * 1000; // 15 minutes

export const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }
  return Notification.permission === 'granted';
};

export const shouldShowAlert = (propertyId: string): boolean => {
  // Cleanup old alerts every 15 minutes
  const now = Date.now();
  if (now - state.lastCleanup > ALERT_EXPIRY) {
    state.alertedIds.clear();
    state.lastCleanup = now;
  }
  
  if (state.alertedIds.has(propertyId)) {
    return false;
  }
  
  state.alertedIds.add(propertyId);
  return true;
};

export const showPropertyAlert = (property: {
  id: string;
  title: string;
  price: number;
  image?: string;
  address?: string;
}) => {
  if (!shouldShowAlert(property.id)) {
    return;
  }
  
  // In-app toast
  toast.success(`¡Propiedad encontrada! ${formatCOP(property.price)}`, {
    description: property.title || property.address,
    duration: 8000,
    action: {
      label: 'Ver',
      onClick: () => {
        // Navigate to property detail
        window.open(`/propiedades/${property.id}`, '_blank');
      }
    }
  });
  
  // Web Notification if permitted
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const notification = new Notification('¡Propiedad encontrada!', {
        body: `${property.title || property.address}\n${formatCOP(property.price)}`,
        icon: property.image || '/icon-192.png',
        badge: '/icon-192.png',
        tag: property.id,
        requireInteraction: false,
        silent: false
      });
      
      notification.onclick = () => {
        window.focus();
        window.open(`/propiedades/${property.id}`, '_blank');
        notification.close();
      };
      
      // Auto close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }
};

export const clearAlertHistory = () => {
  state.alertedIds.clear();
  state.lastCleanup = Date.now();
};