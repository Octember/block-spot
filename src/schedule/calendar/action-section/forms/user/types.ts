export interface UserListItemProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
  selected: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
} 