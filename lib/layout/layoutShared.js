export function resolveBaseAttrs(props, defaultMcComponent) {
    return {
        id: props.id,
        role: props.role,
        "aria-label": props["aria-label"],
        "aria-labelledby": props["aria-labelledby"],
        "aria-describedby": props["aria-describedby"],
        "data-mc-component": props.dataMcComponent ?? defaultMcComponent,
        ...(props.data ?? {}),
    };
}
export function spaceClass(prefix, token) {
    return `${prefix}--${token}`;
}
export function joinClasses(...classes) {
    return classes.filter((c) => Boolean(c)).join(" ");
}
