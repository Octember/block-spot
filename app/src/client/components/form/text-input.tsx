import { forwardRef, InputHTMLAttributes } from "react"

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ ...props }, ref) => {
  return <input ref={ref} type="text" className="border border-gray-300 rounded-md px-2 py-1 text-sm" {...props} />
})