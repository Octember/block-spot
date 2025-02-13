import { Over } from "@dnd-kit/core";

const GrayColorStyle =
  // "bg-violet-200/20 border-violet-400 hover:border-violet-400";
  "bg-[#F7F4F3] border-[#B69A91]";
// "bg-gradient-to-br from-emerald-600/10 to-emerald-600/20  hover:from-emerald-600/20 hover:to-emerald-600/10  border-emerald-800 hover:border-emerald-700";
// "bg-gradient-to-br from-emerald-600/10 to-emerald-600/20  hover:from-emerald-600/20 hover:to-emerald-600/10  border-emerald-800 hover:border-emerald-700";
// "bg-emerald-800/10  hover:from-gray-50 hover:to-gray-300 border-emerald-800 hover:border-emerald-700";
const BlueColorStyle =
  "bg-gradient-to-br from-cyan-500/20 to-cyan-500/10 hover:from-cyan-500/10 hover:to-cyan-500/20 border-cyan-800 hover:border-cyan-600";

export function getColorStyles({
  isDraft,
  over,
  isDragging,
  otherNodeActive,
  isOwner,
}: {
  isDraft: boolean;
  over: Over | null;
  isDragging: boolean;
  otherNodeActive: boolean;
  isOwner: boolean;
}) {
  const opacityStyle = isDragging ? "opacity-50" : "";

  if (isDragging && over && over.data.current?.occupied) {
    return `bg-red-50 hover:bg-red-100 border-red-500 ${opacityStyle}`;
  }
  if (isDraft || isDragging) {
    return `${BlueColorStyle} ${opacityStyle}`;
  }

  if (otherNodeActive) {
    return GrayColorStyle;
  }

  if (isOwner) {
    return BlueColorStyle;
  }

  return `${GrayColorStyle} cursor-not-allowed`;
}
