import { createContext, useContext, useMemo } from 'react';
import { User } from 'wasp/entities';
import { useQuery, getUserOrganization } from 'wasp/client/operations';

type AuthUser = User;

interface AuthUserContextType {
  user: AuthUser | undefined;
  role: "OWNER" | "MEMBER" | undefined;
  isOwner: boolean;
  isLoading: boolean;
}

const AuthUserContext = createContext<AuthUserContextType | undefined>(undefined);

interface AuthUserProviderProps {
  user: AuthUser | undefined;
}

export const AuthUserProvider: React.FC<React.PropsWithChildren<AuthUserProviderProps>> = ({
  user,
  children,
}) => {
  const { data: organization, isLoading: isOrganizationLoading } = useQuery(getUserOrganization);

  const orgMember = useMemo(() => organization?.users.find(
    (member) =>
      member.user.id === user?.id,
  ),
    [organization, user],
  );

  return (
    <AuthUserContext.Provider value={{ user, role: orgMember?.role, isOwner: orgMember?.role === "OWNER", isLoading: isOrganizationLoading }}>
      {children}
    </AuthUserContext.Provider>
  );
};

export const useAuthUser = () => {
  const context = useContext(AuthUserContext);
  if (!context) {
    throw new Error('useAuthUser must be used within an AuthUserProvider');
  }
  return context;
};
