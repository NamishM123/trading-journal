import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { GlowCard } from "./GalaxyKit";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <GlowCard
      glowColor="blue"
      radius={16}
      className={cx(
        "block p-5 shadow-[0_14px_34px_rgba(0,0,0,0.38)]",
        className
      )}
    >
      {children}
    </GlowCard>
  );
}

export function SectionTitle({
  children,
  hint,
}: {
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-ink">
        <span className="h-[0.45rem] w-[0.45rem] flex-shrink-0 rounded-[2px] bg-accent shadow-[0_0_8px_rgba(69,196,255,0.8)]" />
        {children}
      </h2>
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  const styles = {
    primary:
      "bg-accent text-accent-fg hover:bg-accent-hover border border-transparent shadow-[var(--glow)]",
    secondary:
      "bg-surface-2 text-ink border border-line-strong hover:bg-[rgba(148,190,255,0.1)] backdrop-blur",
    ghost: "bg-transparent text-muted hover:text-ink hover:bg-surface-2 border border-transparent",
    danger:
      "bg-down-soft text-down border border-[rgba(255,93,104,0.3)] hover:bg-[rgba(255,93,104,0.2)]",
  }[variant];
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50",
        styles,
        className
      )}
      {...props}
    />
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return (
    <input
      className={cx(
        "w-full rounded-xl border border-line bg-[rgba(6,11,19,0.65)] px-3 py-2 text-sm text-ink transition-colors hover:border-line-strong",
        className
      )}
      {...rest}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, ...rest } = props;
  return (
    <select
      className={cx(
        "w-full rounded-xl border border-line bg-[rgba(6,11,19,0.65)] px-3 py-2 pr-9 text-sm text-ink transition-colors hover:border-line-strong",
        className
      )}
      {...rest}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return (
    <textarea
      className={cx(
        "w-full rounded-xl border border-line bg-[rgba(6,11,19,0.65)] px-3 py-2 text-sm leading-relaxed text-ink transition-colors hover:border-line-strong",
        className
      )}
      rows={props.rows ?? 3}
      {...rest}
    />
  );
}

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1.5 block font-mono text-[0.64rem] font-medium uppercase tracking-[0.1em] text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "up" | "down" | "warn";
  className?: string;
}) {
  const styles = {
    neutral: "bg-surface-2 text-muted border-line",
    accent: "bg-accent-soft text-accent border-[rgba(69,196,255,0.3)]",
    up: "bg-up-soft text-up border-[rgba(47,227,142,0.3)]",
    down: "bg-down-soft text-down border-[rgba(255,93,104,0.3)]",
    warn: "bg-warn-soft text-warn border-[rgba(255,180,84,0.3)]",
  }[tone];
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[0.64rem] font-semibold",
        styles,
        className
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line-strong px-6 py-12 text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}
