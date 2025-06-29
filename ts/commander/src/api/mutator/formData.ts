// ts/commander/src/api/mutator/formData.ts
export function createFormData(body: Record<string, any>): FormData {
    const formData = new FormData()
    Object.entries(body).forEach(([key, val]) => {
        if (val == null) return
        if (Array.isArray(val)) {
            val.forEach((v) => {
                formData.append(key, v as string)
            })
        } else {
            formData.append(key, val as string | Blob)
        }
    })
    return formData
}
