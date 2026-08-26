import {
  createBrowserRouter,
  Outlet,
  RouterProvider,
  useParams,
} from "react-router-dom";
import { CoreProvider } from "@common/contexts/CoreContext";
import { ToastProvider } from "@common/contexts/ToastContext";
import { NotesLayout } from "./modules/notes/components/NotesLayout/NotesLayout";
import { NotePage } from "./modules/notes/components/NotePage/NotePage";

function AppProviders(): JSX.Element {
  return (
    <CoreProvider>
      <ToastProvider>
        <Outlet />
      </ToastProvider>
    </CoreProvider>
  );
}

function RootLayout(): JSX.Element {
  return <Outlet />;
}

// Adapts router params into the note page boundary.
function NoteRoute(): JSX.Element {
  const { noteId } = useParams();

  return <NotePage noteId={noteId} />;
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
                element: <NoteRoute />,
              },
              {
                path: "/notes",
                element: <NoteRoute />,
              },
              {
                path: "/notes/:noteId",
                element: <NoteRoute />,
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
