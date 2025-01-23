import { Link as WaspRouterLink } from "wasp/client/router";
import logo from "../static/logo.svg";

export const LogoComponent = () => {
  return (
    <WaspRouterLink to="/" className="flex flex-row items-center">
      <img className="size-8" src={logo} alt="BlockSpot" />
      <span className="ml-2 text-sm font-semibold leading-6 dark:text-white">
        blockspot
      </span>
    </WaspRouterLink>
  );
};
