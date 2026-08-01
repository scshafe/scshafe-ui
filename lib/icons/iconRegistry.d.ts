type IconComponent = (props: Record<string, unknown>) => any;
export declare function iconComponentFor(name: string): IconComponent | null;
export declare function iconRegistryKeys(): string[];
export declare const FALLBACK_ICON_COMPONENT: IconComponent;
export declare const ICON_LIBRARY_ID = "iconoir-react@regular";
export {};
