import { FC, ReactNode } from "react"



export const ButtonGroup = ({ items }: { items: ButtonGroupItemProps[] }) => {
  return <span className="isolate inline-flex rounded-md shadow-sm [&>*:not(:first-child)]:-ml-px [&>*:first-child]:rounded-l-md [&>*:last-child]:rounded-r-md">
    {items.map((item, index) => (
      <ButtonGroupItem key={`${item.label}-${index}`} label={item.label} onClick={item.onClick} />
    ))}
  </span>
}

export type ButtonGroupItemProps = {
  label: ReactNode;
  onClick: () => void;
}

const ButtonGroupItem: FC<ButtonGroupItemProps> = ({ label, onClick }) => {
  return <button
    type="button"
    className="relative inline-flex items-center bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10"
    onClick={onClick}
  >
    {label}
  </button>
}