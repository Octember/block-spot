import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthUser } from "../../auth/providers/AuthUserProvider";
import { PUBLIC_ROUTES } from "../components/constants/public-routes";

export function useCalendarRedirect() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isOwner, venueId } = useAuthUser();

  useEffect(() => {
    if (
      !user ||
      location.pathname === "/" ||
      PUBLIC_ROUTES.find((route) => location.pathname.startsWith(route))
    ) {
      return;
    }
    console.log("venueId", venueId);

    if (!isOwner && venueId) {
      navigate(`/schedule/${venueId}`, { replace: true });
    }
  }, [user, isOwner, location.pathname, navigate, venueId]);
}
