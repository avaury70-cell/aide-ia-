import { useCallback } from "react";

import { api, ApiError } from "../api/client";
import type { Device } from "../api/types";
import { useHome } from "../hooks/useHome";

/** Commande manuelle : confirmation pour les appareils sensibles, retour d'erreur en notification. */
export function useDeviceAction() {
  const { pushToast } = useHome();
  return useCallback(
    async (device: Device, action: string) => {
      if (device.is_sensitive && !window.confirm(`Confirmer « ${action} » sur ${device.name} ?`)) return;
      try {
        await api.deviceAction(device.entity_id, action);
      } catch (e) {
        pushToast("Commande refusée", e instanceof ApiError ? e.message : "Erreur inconnue");
      }
    },
    [pushToast],
  );
}
