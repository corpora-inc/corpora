// ts/commander/src/components/ui/textarea.tsx
import * as React from "react"

import { cn } from "@/lib/utils"

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

function Textarea({ className, onChange, value, defaultValue, ...props }: TextareaProps) {
  const isControlled = value !== undefined

  const initialText =
    typeof value === "string"
      ? value
      : typeof defaultValue === "string"
        ? defaultValue
        : ""

  const [wordCount, setWordCount] = React.useState(() => {
    const trimmed = initialText.trim()
    if (!trimmed) return 0
    return trimmed.split(/\s+/).filter(Boolean).length
  })

  const updateCount = React.useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed) {
      setWordCount(0)
      return
    }
    setWordCount(trimmed.split(/\s+/).filter(Boolean).length)
  }, [])

  // For controlled usage, recompute when value changes
  React.useEffect(() => {
    if (!isControlled || typeof value !== "string") return
    updateCount(value)
  }, [isControlled, value, updateCount])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!isControlled) {
      // Uncontrolled: read from the DOM value, but do NOT mirror it in state
      updateCount(e.target.value)
    }

    if (onChange) {
      onChange(e)
    }
  }

  const userAriaInvalid = (props as unknown as Record<string, unknown>)[
    "aria-invalid"
  ] as boolean | undefined

  return (
    <div className="space-y-1">
      <textarea
        data-slot="textarea"
        className={cn(
          "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "resize-y",
          className
        )}
        {...props}
        {...(isControlled ? { value } : { defaultValue })}
        onChange={handleChange}
        aria-invalid={Boolean(userAriaInvalid)}
      />

      <div className="flex justify-end text-xs text-muted-foreground">
        <span aria-live="polite">{wordCount}</span>
        <span className="ml-1">words</span>
      </div>
    </div>
  )
}

export { Textarea }
