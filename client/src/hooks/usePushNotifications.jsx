'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { urlBase64ToUint8Array } from '@/lib';

const API = process.env.NEXT_PUBLIC_API_URL;
const getToken = () => localStorage.getItem('token');

export function usePushNotifications() {
  const [permission, setPermission] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    setPermission(Notification.permission);
    checkExistingSubscription();
  }, []);

  const checkExistingSubscription = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    } catch {
      // Service worker not ready yet
    }
  };

  const registerServiceWorker = async () => {
    const reg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    return reg;
  };

  const subscribe = async () => {
    if (!('Notification' in window)) {
      toast.error('Push notifications are not supported in this browser.');
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        toast.error('Notification permission denied.');
        return;
      }

      // Get VAPID public key from server
      const keyRes = await fetch(`${API}/notifications/vapid-public-key`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const { publicKey } = await keyRes.json();

      const reg = await registerServiceWorker();

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Save subscription to server
      await fetch(`${API}/notifications/push-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(subscription),
      });

      setIsSubscribed(true);
      toast.success('Push notifications enabled!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to enable push notifications.');
    }
  };

  const unsubscribe = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        await fetch(`${API}/notifications/push-subscription`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }

      setIsSubscribed(false);
      toast.success('Push notifications disabled.');
    } catch (err) {
      toast.error('Failed to disable push notifications.');
    }
  };

  return { permission, isSubscribed, subscribe, unsubscribe };
}