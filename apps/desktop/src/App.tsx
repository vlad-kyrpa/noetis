import {
  createBrowserRouter,
  Outlet,
  RouterProvider,
  useParams,
} from "react-router-dom";
import { NotesLayout } from "@common/components";
import { CoreProvider } from "@common/contexts/CoreContext";
import { ToastProvider } from "@common/contexts/ToastContext/ToastContext";
import { NotePage } from "./modules/notes/components/NotePage/NotePage";
import { StoredQueryPage } from "./modules/queries/components/StoredQueryPage/StoredQueryPage";

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

// Adapts router params into the stored-query page boundary.
function StoredQueryRoute(): JSX.Element {
  const { storedQueryId } = useParams();

  return <StoredQueryPage storedQueryId={storedQueryId} />;
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
              {
                path: "/queries/:storedQueryId",
                element: <StoredQueryRoute />,
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
