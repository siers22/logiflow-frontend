import type { ReactNode, SelectHTMLAttributes } from 'react';
export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {error && (
        <span role="alert" className="block text-xs text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}
export function NativeSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`h-10 w-full rounded-md border border-input bg-background px-3 text-sm ${props.className ?? ''}`}
    />
  );
}
