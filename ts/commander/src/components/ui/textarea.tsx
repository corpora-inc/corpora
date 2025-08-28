import * as React from "react"

import { cn } from "@/lib/utils"

type TextareaProps = React.ComponentProps<"textarea">

function Textarea({ className, ...props }: TextareaProps) {
  const isControlled = props.value !== undefined
  const [internalValue, setInternalValue] = React.useState<string>(
    // defaultValue may be undefined or not a string
    props.defaultValue ? String(props.defaultValue) : ""
  )

  const currentValue = String(isControlled ? props.value ?? "" : internalValue)

  const countWords = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return 0
    return trimmed.split(/\s+/).filter(Boolean).length
  }

  const wordCount = countWords(currentValue)

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (!isControlled) setInternalValue(e.target.value)
    if (props.onChange) props.onChange(e)
  }

  const userAriaInvalid = (props as unknown as Record<string, unknown>)["aria-invalid"] as boolean | undefined


  return (
    <div className="relative">
      <textarea
        data-slot="textarea"
        className={cn(
          "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "resize-y",
          className
        )}
        {...props}
        onChange={handleChange}
        aria-invalid={Boolean(userAriaInvalid)}
      />

      <div className="pointer-events-none absolute right-2 top-1 text-xs text-muted-foreground bg-gray-400/20 py-0.5 px-1 rounded-sm">
        <span aria-live="polite">{wordCount}</span>
        <span className="ml-1">words</span>
      </div>
    </div>
  )
}

export { Textarea }
