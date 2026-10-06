import React from "react";

/** Banner tones, the same vocabulary as the native SuiBanner: info, ok (success), warn
 * (warning) and danger (error). */
export type BannerTone = "info" | "ok" | "warn" | "danger";

export const BANNER_TONES: ReadonlyArray<BannerTone> = ["info", "ok", "warn", "danger"];

/** What each tone shows and announces: the status-tone colour family, the glyph in the
 * decorative mark, and the visually hidden prefix a screen reader reads before the message. */
export const BANNER_TONE_DETAILS: Readonly<Record<BannerTone, { readonly color: "blue" | "green" | "yellow" | "red"; readonly mark: string; readonly label: string }>> = {
  info: { color: "blue", mark: "i", label: "Information" },
  ok: { color: "green", mark: "✓", label: "Success" },
  warn: { color: "yellow", mark: "!", label: "Warning" },
  danger: { color: "red", mark: "!", label: "Error" }
};

/** An unknown tone falls back to "info", as an unknown status tone falls back to blue. */
export function bannerTone(tone: unknown): BannerTone {
  return BANNER_TONES.includes(tone as BannerTone) ? tone as BannerTone : "info";
}

/** warn and danger interrupt (role="alert"); info and ok are polite (role="status"). */
export function bannerRole(tone: BannerTone): "alert" | "status" {
  return tone === "warn" || tone === "danger" ? "alert" : "status";
}

export interface BannerProps {
  tone?: BannerTone;
  /** A short, strong first line. */
  title?: React.ReactNode;
  /** The message. `children` takes its place when given. */
  text?: React.ReactNode;
  children?: React.ReactNode;
  /** Buttons or links beside the message. */
  actions?: React.ReactNode;
  /** Show a Dismiss button. It hides the banner (or, when `open` is controlled, asks the host to) and calls `onDismiss`. */
  dismissible?: boolean;
  onDismiss?: () => void;
  /** The dismiss button's accessible name. */
  dismissLabel?: string;
  /** Controlled visibility; omitted, the banner keeps its own and starts open. */
  open?: boolean;
  /** The live-region role; defaults by tone (see bannerRole). `null` renders none. */
  role?: "alert" | "status" | "note" | null;
  /** The visually hidden prefix (default by tone, e.g. "Warning"); `null` renders none. */
  toneLabel?: string | null;
  id?: string;
  className?: string;
}

/** An inline status message across a pane or page: info, ok, warn or danger, with an
 * optional title, actions and Dismiss button. The web counterpart of the native SuiBanner. */
export function Banner({ tone: toneProp, title, text, children, actions, dismissible = false, onDismiss, dismissLabel = "Dismiss", open, role, toneLabel, id, className }: BannerProps) {
  const [ownOpen, setOwnOpen] = React.useState(true);
  const tone = bannerTone(toneProp ?? "info");
  const details = BANNER_TONE_DETAILS[tone];
  const shown = open ?? ownOpen;
  if (!shown) return null;
  const prefix = toneLabel === undefined ? details.label : toneLabel;
  const message = children ?? text;
  const hasMessage = message !== undefined && message !== null && message !== false && message !== "";
  const hasTitle = title !== undefined && title !== null && title !== false && title !== "";
  const dismiss = () => {
    if (open === undefined) setOwnOpen(false);
    onDismiss?.();
  };
  return (
    <div
      id={id}
      className={`sui-banner sui-banner--${tone}${className ? ` ${className}` : ""}`}
      role={role === null ? undefined : role ?? bannerRole(tone)}
      data-sui-component="Banner"
      data-sui-tone={tone}
    >
      <span className="sui-banner-mark" aria-hidden="true">{details.mark}</span>
      <div className="sui-banner-body">
        {prefix ? <span className="sui-visually-hidden">{`${prefix}: `}</span> : null}
        {hasTitle ? <strong className="sui-banner-title">{title}</strong> : null}
        {hasMessage ? <div className="sui-banner-text">{message}</div> : null}
      </div>
      {actions ? <div className="sui-banner-actions">{actions}</div> : null}
      {dismissible ? <button type="button" className="sui-banner-dismiss" aria-label={dismissLabel} onClick={dismiss}>×</button> : null}
    </div>
  );
}
