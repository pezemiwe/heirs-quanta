import { Paperclip, X } from "lucide-react";

export function DocumentsSection({
  attachments,
  setAttachments,
}: {
  attachments: File[];
  setAttachments: React.Dispatch<React.SetStateAction<File[]>>;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-dark-gray">
        Document Attachments
      </h2>
      <div className="space-y-3">
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-border bg-gray-50 px-4 py-3 hover:border-primary hover:bg-pale-red/20 transition-colors">
          <Paperclip className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-400">
            Attach term sheet, IC memo, or supporting documents…
          </span>
          <input
            type="file"
            multiple
            className="hidden"
            accept=".pdf,.doc,.docx,.xlsx,.csv"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              setAttachments((prev) => [...prev, ...files]);
              e.target.value = "";
            }}
          />
        </label>
        {attachments.length > 0 && (
          <ul className="space-y-1.5">
            {attachments.map((f, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2 text-dark-gray">
                  <Paperclip className="h-3.5 w-3.5 text-gray-400" />
                  <span className="font-medium">{f.name}</span>
                  <span className="text-xs text-gray-400">
                    ({(f.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setAttachments((prev) => prev.filter((_, j) => j !== i))
                  }
                  className="text-gray-400 hover:text-danger"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
