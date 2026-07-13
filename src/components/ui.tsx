import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

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
    <div
      className={cx(
        "rounded-2xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        className
      )}
    >
      {children}
    </div>
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
      <h2 className="text-sm font-semibold tracking-wide text-ink">{children}</h2>
      {hint ? <p className="mt-0.5 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  const styles = {
    primary:
      "bg-accent text-accent-fg hover:bg-accent-hover border border-transparent",
    secondary:
      "bg-surface text-ink border border-line-strong hover:bg-surface-2",
    ghost: "bg-transparent text-muted hover:text-ink hover:bg-surface-2 border border-transparent",
    danger: "bg-transparent text-down border border-line hover:bg-down-soft",
  }[variant];
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50",
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
        "w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink",
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
        "w-full rounded-xl border border-line bg-surface px-3 py-2 pr-9 text-sm text-ink",
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
        "w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm leading-relaxed text-ink",
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
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
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
    neutral: "bg-surface-2 text-muted",
    accent: "bg-accent-soft text-accent",
    up: "bg-up-soft text-up",
    down: "bg-down-soft text-down",
    warn: "bg-warn-soft text-warn",
  }[tone];
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
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
