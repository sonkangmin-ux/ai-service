"use client";

import {
  cloneElement,
  isValidElement,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

export function Button({
  variant = "primary",
  loading = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
}) {
  const styles = {
    primary: "bg-primary text-white hover:bg-primary-hover",
    secondary: "bg-surface text-text border border-border hover:bg-background",
    ghost: "bg-transparent text-text hover:bg-background",
    danger: "bg-error text-white hover:opacity-90",
  }[variant];
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex h-12 min-h-12 items-center justify-center gap-2 rounded-[10px] px-4 text-[16px] leading-[26px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 ${styles} ${className}`}
    >
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden /> : null}
      {children}
    </button>
  );
}

export function Input({
  label,
  helper,
  error,
  passwordToggle,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  helper?: string;
  error?: string;
  passwordToggle?: boolean;
}) {
  const id = useId();
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const type = passwordToggle ? (show ? "text" : "password") : props.type;
  return (
    <label className={`block ${className}`} htmlFor={id}>
      <span className="label mb-2 block text-text">{label}</span>
      <div className="relative">
        <input
          {...props}
          id={id}
          type={type}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : helper ? `${id}-helper` : undefined}
          onKeyUp={(event) => {
            if (passwordToggle) setCaps(event.getModifierState("CapsLock"));
            props.onKeyUp?.(event);
          }}
          className="h-12 w-full rounded-[10px] border border-border bg-surface px-3 text-[16px] leading-[26px] focus-visible:outline-2 focus-visible:outline-primary"
        />
        {passwordToggle ? (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-2 text-[14px] text-muted"
            onClick={() => setShow((value) => !value)}
          >
            {show ? "숨기기" : "표시"}
          </button>
        ) : null}
      </div>
      {caps ? <p className="helper mt-1">Caps Lock이 켜져 있습니다.</p> : null}
      {helper && !error ? (
        <p id={`${id}-helper`} className="helper mt-1">
          {helper}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-[14px] leading-[22px] text-error">
          {error}
        </p>
      ) : null}
    </label>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow)] ${className}`}>
      {children}
    </section>
  );
}

export function Badge({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "success" | "warning" | "error" | "primary";
}) {
  const color = {
    muted: "bg-background text-muted",
    success: "bg-green-50 text-success",
    warning: "bg-amber-50 text-warning",
    error: "bg-red-50 text-error",
    primary: "bg-blue-50 text-primary",
  }[tone];
  return <span className={`inline-flex rounded-full px-3 py-1 text-[12px] leading-[18px] ${color}`}>{children}</span>;
}

export function Alert({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "success" | "warning" | "error";
}) {
  const color = {
    muted: "border-border text-muted",
    success: "border-success text-success",
    warning: "border-warning text-warning",
    error: "border-error text-error",
  }[tone];
  return <div className={`rounded-[10px] border px-4 py-3 text-[14px] leading-[22px] ${color}`}>{children}</div>;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-border/60 ${className}`} />;
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <Card className="text-center">
      <h2 className="text-[20px] font-semibold">{title}</h2>
      <p className="helper mt-2">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  );
}

export function ProgressSteps({ current, total }: { current: number; total: number }) {
  return (
    <p className="label text-muted" aria-live="polite">
      {current}/{total}
    </p>
  );
}

export function Modal({
  open,
  title,
  children,
  onClose,
  returnFocus,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  returnFocus?: HTMLElement | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const node = ref.current;
    const previous = returnFocus ?? (document.activeElement as HTMLElement | null);
    const focusables = () =>
      Array.from(
        node?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
    focusables()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !node) return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [open, onClose, returnFocus]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-text/40 p-4">
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="modal-title" className="w-full max-w-[440px] rounded-2xl bg-surface p-6">
        <h2 id="modal-title" className="text-[20px] font-semibold">
          {title}
        </h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export function ToastViewport({
  message,
  onClear,
}: {
  message: string | null;
  onClear: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClear, 4000);
    return () => clearTimeout(timer);
  }, [message, onClear]);
  if (!message) return null;
  return (
    <div className="fixed bottom-20 right-4 z-40 max-w-sm rounded-[10px] bg-text px-4 py-3 text-white md:bottom-4" role="status">
      {message}
    </div>
  );
}

export function PageTitle({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, [children]);
  return (
    <h1 ref={ref} tabIndex={-1} className="page-title outline-none">
      {children}
    </h1>
  );
}

export function visuallyWrap(child: ReactElement, extra: Record<string, unknown>) {
  if (!isValidElement(child)) return child;
  return cloneElement(child, extra);
}
