import { FC } from "react";
import { User } from "wasp/entities";

interface UserAvatarProps {
  user: Pick<User, "name" | "email">;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-12 h-12 text-lg",
};

export const UserAvatar: FC<UserAvatarProps> = ({
  user,
  size = "md",
  className = "",
}) => {
  const getInitials = (user: Pick<User, "name" | "email">) => {
    if (user.name) {
      const names = user.name.split(" ");
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return user.name[0].toUpperCase();
    }
    return user.email?.[0].toUpperCase() ?? "?";
  };

  return (
    <div
      className={`
        flex items-center justify-center 
        rounded-full bg-sky-600 text-white font-medium
        ${sizeClasses[size]}
        ${className}
      `}
      title={user.name || user.email || "Unknown user"}
    >
      {getInitials(user)}
    </div>
  );
};
