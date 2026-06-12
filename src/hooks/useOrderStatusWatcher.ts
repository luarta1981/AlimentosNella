import { type User } from 'firebase/auth';
import { useEffect, useRef } from 'react';

import { onPedidosUsuarioChange } from '@/services/firestore';
import { STATUS_NOTIF, triggerLocalNotification } from '@/services/notifications';

export function useOrderStatusWatcher(user: User | null) {
  const prevStatuses = useRef<Map<string, string>>(new Map());
  const isFirstLoad  = useRef(true);

  useEffect(() => {
    if (!user) {
      prevStatuses.current.clear();
      isFirstLoad.current = true;
      return;
    }

    const unsub = onPedidosUsuarioChange(user.uid, (orders) => {
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        orders.forEach((o) => prevStatuses.current.set(o.id!, o.status));
        return;
      }

      orders.forEach((o) => {
        const prev = prevStatuses.current.get(o.id!);
        if (prev && prev !== o.status) {
          const notif = STATUS_NOTIF[o.status];
          if (notif) {
            const shortId = (o.id ?? '').slice(-8).toUpperCase();
            triggerLocalNotification(notif.title, notif.body(shortId), {
              orderId: o.id ?? '',
              status: o.status,
            });
          }
        }
        prevStatuses.current.set(o.id!, o.status);
      });
    });

    return () => {
      unsub();
      prevStatuses.current.clear();
      isFirstLoad.current = true;
    };
  }, [user]);
}
