export interface User {
  id: string;
  name: string;
  email: string;
}

export interface UserListItemProps {
  user: User;
  selected: boolean;
  onSelect?: (user: User) => void;
} 