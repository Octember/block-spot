export const UpdateButton = ({
  onClick,
  color,
  text,
  type,
}: {
  onClick?: () => void;
  color: "red" | "green";
  text: string;
  type?: "submit" | undefined;
}) => {
  const colorStyle = color === "red" ? "bg-red-500" : "bg-green-500";
  const hoverStyle =
    color === "red" ? "hover:bg-red-600" : "hover:bg-green-600";

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${colorStyle} justify-self-end ${hoverStyle} text-white px-2 py rounded`}
    >
      {text}
    </button>
  );
};
