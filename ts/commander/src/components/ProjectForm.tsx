// ts/commander/src/components/ProjectForm.tsx

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { LLMEnhanceModal } from "./LLMEnhanceModal"

export type ProjectFields = {
    title: string
    subtitle?: string
    purpose?: string
    instructions?: string
    voice?: string
    has_images: boolean
    author?: string
    publisher?: string
    isbn?: string
    language?: string
    publication_date?: string
}

export interface ProjectFormProps {
    /** All the current field-values */
    values: ProjectFields
    /** Called when any one field changes */
    onChange: (patch: Partial<ProjectFields>) => void
    /** When user clicks “Save” */
    onSubmit: () => void
    /** Label for the submit button */
    submitLabel: string
    /** Disable the submit button while saving */
    submitDisabled?: boolean
    /** Optional “Cancel” handler */
    onCancel?: () => void
}

export function ProjectForm({
    values,
    onChange,
    onSubmit,
    submitLabel,
    submitDisabled = false,
    onCancel,
}: ProjectFormProps) {
    const [enhanceOpen, setEnhanceOpen] = useState(false)

    const enhanceSchema = {
        title: "str",
        subtitle: "str",
        purpose: "str",
        instructions: "str",
        voice: "str",
    } as const

    return (
        <div className="space-y-6">
            {/* Title */}
            <div>
                <label className="block text-sm font-medium">Title*</label>
                <Input
                    value={values.title}
                    onChange={(e) => onChange({ title: e.target.value })}
                />
            </div>

            {/* Subtitle */}
            <div>
                <label className="block text-sm font-medium">Subtitle</label>
                <Input
                    value={values.subtitle ?? ""}
                    onChange={(e) => onChange({ subtitle: e.target.value })}
                />
            </div>

            {/* Purpose */}
            <div>
                <label className="block text-sm font-medium">Purpose</label>
                <Textarea
                    className="h-24"
                    value={values.purpose ?? ""}
                    onChange={(e) => onChange({ purpose: e.target.value })}
                />
            </div>

            {/* Instructions */}
            <div>
                <label className="block text-sm font-medium">Instructions</label>
                <Textarea
                    className="h-24"
                    value={values.instructions ?? ""}
                    onChange={(e) => onChange({ instructions: e.target.value })}
                />
            </div>

            {/* Voice */}
            <div>
                <label className="block text-sm font-medium">Voice</label>
                <Textarea
                    className="h-24"
                    value={values.voice ?? ""}
                    onChange={(e) => onChange({ voice: e.target.value })}
                />
            </div>

            {/* Has images */}
            <div className="flex items-center space-x-2">
                <input
                    id="hasImages"
                    type="checkbox"
                    checked={values.has_images}
                    onChange={(e) => onChange({ has_images: e.target.checked })}
                />
                <label htmlFor="hasImages" className="text-sm">
                    Will include images?
                </label>
            </div>

            {/* Author / Publisher */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium">Author</label>
                    <Input
                        value={values.author ?? ""}
                        onChange={(e) => onChange({ author: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Publisher</label>
                    <Input
                        value={values.publisher ?? ""}
                        onChange={(e) => onChange({ publisher: e.target.value })}
                    />
                </div>
            </div>

            {/* ISBN / Language */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium">ISBN</label>
                    <Input
                        value={values.isbn ?? ""}
                        onChange={(e) => onChange({ isbn: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Language</label>
                    <Input
                        value={values.language ?? ""}
                        onChange={(e) => onChange({ language: e.target.value })}
                    />
                </div>
            </div>

            {/* Publication date */}
            <div>
                <label className="block text-sm font-medium">Publication Date</label>
                <Input
                    type="date"
                    value={values.publication_date ?? ""}
                    onChange={(e) => onChange({ publication_date: e.target.value })}
                    className="w-full"
                />
            </div>

            {/* Actions */}
            {/* Add class to make the buttons be on the right */}
            <div className="flex items-center gap-2 justify-end">
                <Button
                    variant="outline"
                    onClick={() => setEnhanceOpen(true)}
                    disabled={!values.title.trim()}
                >
                    Mutate with AI
                </Button>
                <div className="space-x-2">
                    {onCancel && (
                        <Button variant="secondary" onClick={onCancel}>
                            Cancel
                        </Button>
                    )}
                    <Button onClick={onSubmit} disabled={submitDisabled}>
                        {submitLabel}
                    </Button>
                </div>
            </div>

            <LLMEnhanceModal<Pick<ProjectFields, keyof typeof enhanceSchema>>
                open={enhanceOpen}
                schema={enhanceSchema}
                initialData={{
                    title: values.title,
                    subtitle: values.subtitle ?? "",
                    purpose: values.purpose ?? "",
                    instructions: values.instructions ?? "",
                    voice: values.voice ?? "",
                }}
                onAccept={(suggested) => {
                    onChange(suggested as Partial<ProjectFields>)
                    setEnhanceOpen(false)
                }}
                onClose={() => setEnhanceOpen(false)}
            />
        </div>
    )
}
