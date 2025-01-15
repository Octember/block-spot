import { ReactNode } from "react";

export const Button = ({ icon, children, onClick, type = 'button' }: { icon?: ReactNode, children: ReactNode, onClick?: () => void, type?: 'button' | 'submit' | 'reset' }) => {
  return <button
    type={type}
    className="inline-flex items-center gap-x-1.5 rounded-md bg-blue-500 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    onClick={onClick}
  >
    {icon}
    {children}
  </button>
}