import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { buildSignOutUrl } from "./buildSignOutUrl.js";
import { useIdentity } from "./useIdentity.js";
function IdentityChip({ identity, location, className }) {
    if (identity.status !== "identified")
        return null;
    const label = identity.email || identity.preferredUsername || identity.user;
    const href = buildSignOutUrl(location);
    return (_jsxs("div", { className: ["mc-user-menu", className].filter(Boolean).join(" "), "data-mc-component": "UserMenu", children: [_jsx("span", { className: "mc-user-menu-identity", title: label, children: label }), href ? _jsx("a", { className: "mc-button mc-button-secondary mc-button-mini", href: href, children: "Sign out" }) : null] }));
}
function ConnectedUserMenu(props) {
    const identity = useIdentity();
    return _jsx(IdentityChip, { ...props, identity: identity });
}
/** Identity chip and RP-initiated Sign out link. Anonymous/loading renders nothing. */
export function UserMenu({ identity, ...props }) {
    return identity
        ? _jsx(IdentityChip, { ...props, identity: identity })
        : _jsx(ConnectedUserMenu, { ...props });
}
