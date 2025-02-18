import { createContext, useContext, useMemo } from "react";
import { User } from "wasp/entities";
import { useQuery, getUserOrganization } from "wasp/client/operations";
import { PaymentPlanId } from "../../payment/plans";

type AuthUser = User;

interface AuthUserContextType {
  user: AuthUser | undefined;
  role: "OWNER" | "MEMBER" | undefined;
  isAdmin: boolean;
  isOwner: boolean;
  isLoading: boolean;
  venueId: string | undefined;
  organizationPlan: PaymentPlanId;
}

const AuthUserContext = createContext<AuthUserContextType | undefined>(
  undefined,
);

interface AuthUserProviderProps {
  user: AuthUser | undefined;
}

export const AuthUserProvider: React.FC<
  React.PropsWithChildren<AuthUserProviderProps>
> = ({ user, children }) => {
  const { data: organization, isLoading: isOrganizationLoading } =
    useQuery(getUserOrganization);

  const orgMember = useMemo(
    () => organization?.users.find((member) => member.user.id === user?.id),
    [organization, user],
  );

  const venueId = useMemo(() => organization?.venues?.[0]?.id, [organization]);

  const organizationPlan = useMemo(
    () => organization?.subscriptionPlanId || PaymentPlanId.Community,
    [organization],
  );

  return (
    <AuthUserContext.Provider
      value={{
        user,
        role: orgMember?.role,
        isAdmin: user?.isAdmin || false,
        isOwner: orgMember?.role === "OWNER",
        isLoading: isOrganizationLoading,
        venueId,
        organizationPlan: organizationPlan as PaymentPlanId,
      }}
    >
      {children}
    </AuthUserContext.Provider>
  );
};

export const useAuthUser = () => {
  const context = useContext(AuthUserContext);
  if (!context) {
    throw new Error("useAuthUser must be used within an AuthUserProvider");
  }
  return context;
};
