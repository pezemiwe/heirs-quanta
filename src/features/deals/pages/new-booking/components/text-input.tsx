export function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-dark-gray outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-gray-300"
    />
  );
}
