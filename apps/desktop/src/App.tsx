import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import { CoreProvider } from "@common/contexts/CoreContext";
import { NotesLayout } from "./modules/notes/components/NotesLayout/NotesLayout";
import { NotesPage } from "./modules/notes/components/NotesPage/NotesPage";

function AppProviders(): JSX.Element {
  return (
    <CoreProvider>
      <Outlet />
    </CoreProvider>
  );
}

function RootLayout(): JSX.Element {
  return <Outlet />;
}

const router = createBrowserRouter([
  {
    element: <AppProviders />,
    children: [
      {
        element: <RootLayout />,
        children: [
          {
            element: <NotesLayout />,
            children: [
              {
                path: "/",
                element: <NotesPage />,
              },
              {
                path: "/notes",
                element: <NotesPage />,
              },
            ],
          },
        ],
      },
    ],
  },
]);

export function App(): JSX.Element {
  return <RouterProvider router={router} />;
}
