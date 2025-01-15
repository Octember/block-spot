import { ReactNode } from "react";

type ButtonProps = {
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

export const Button = ({ icon, children, onClick, type = 'button', variant = 'primary', disabled = false }: ButtonProps) => {
  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-400',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
  }

  const disabledClasses = disabled ? 'opacity-75 cursor-not-allowed' : '';

  return <button
    disabled={disabled}
    type={type}
    className={`inline-flex items-center gap-x-1.5 rounded-md px-2.5 py-1.5 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2  focus-visible:outline-blue-600 ${variantClasses[variant]} ${disabledClasses}`}
    onClick={onClick}
  >
    {icon}
    {children}
  </button>
}