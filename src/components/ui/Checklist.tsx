interface ChecklistItem {
  key: string
  label: string
  checked: boolean
}

interface ChecklistProps {
  items: ChecklistItem[]
  onChange: (key: string, checked: boolean) => void
  title?: string
}

export function Checklist({ items, onChange, title }: ChecklistProps) {
  const done = items.filter((i) => i.checked).length

  return (
    <div>
      {title && (
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
          <span className="text-xs text-gray-500">{done}/{items.length}</span>
        </div>
      )}
      <div className="space-y-2">
        {items.map((item) => (
          <label
            key={item.key}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <input
              type="checkbox"
              checked={item.checked}
              onChange={(e) => onChange(item.key, e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span
              className={`text-sm transition-colors ${
                item.checked ? 'text-gray-400 line-through' : 'text-gray-700'
              }`}
            >
              {item.label}
            </span>
          </label>
        ))}
      </div>
      {items.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all"
                style={{ width: `${(done / items.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">{Math.round((done / items.length) * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  )
}
