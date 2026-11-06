import { routes } from '../../routes';
import { AppArea } from './types';

export const APP_AREA_ROUTE_ROOTS: Readonly<Record<AppArea, string>> = {
  [AppArea.Home]: routes.home,
  [AppArea.Tasks]: routes.tasks.root,
  [AppArea.Notes]: routes.notes.root,
  [AppArea.Expenses]: routes.expenses.root,
  [AppArea.Menu]: routes.menu,
};

const APP_AREAS = Object.values(AppArea);

interface PathAtRouteRootParams {
  pathname: string;
  routeRoot: string;
}

// Matches an area's root page and every nested route below it without letting home match all paths.
const isPathAtRouteRoot = ({ pathname, routeRoot }: PathAtRouteRootParams): boolean =>
  pathname === routeRoot || (routeRoot !== routes.home && pathname.startsWith(`${routeRoot}/`));

// Resolves which app area a URL belongs to, so navigation and contextual controls agree.
export const findAppArea = (pathname: string): AppArea | undefined =>
  APP_AREAS.find((area) => isPathAtRouteRoot({ pathname, routeRoot: APP_AREA_ROUTE_ROOTS[area] }));
