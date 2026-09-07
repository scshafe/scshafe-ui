import { useEffect, useRef, useSyncExternalStore } from "react";
import { createIdentityResource } from "./identityResource.js";
/** Read the browser's oauth2-proxy identity once on mount; refresh is manual.
 * This standalone proxy-session seam needs only React, like LocalPopoverProvider.
 * Hosts that already own identity state can instead pass it to UserMenu.
 */
export function useIdentity() {
    const resourceRef = useRef(null);
    if (!resourceRef.current)
        resourceRef.current = createIdentityResource();
    const resource = resourceRef.current;
    const state = useSyncExternalStore(resource.subscribe, resource.getSnapshot, resource.getServerSnapshot);
    useEffect(() => { void resource.load(); }, [resource]);
    return { ...state, refresh: resource.refresh };
}
