import {useQuery, getUserOrganizationRole} from 'wasp/client/operations';

export const isUserOwner = () => {
  const { data: organizationUser } = useQuery(getUserOrganizationRole);

  return organizationUser?.role === "OWNER";
};
