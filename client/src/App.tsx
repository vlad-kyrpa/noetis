import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom';
import { ADD_ACTION_TREES } from './app/add-action-tree';
import {
  authApi,
  authClient,
  authSession,
  backendClientFactory,
  regionalClock,
  regionalSettings,
} from './app/composition';
import { BackendClientProvider } from './common/backend-client/BackendClientProvider';
import { Layout } from './common/components/Layout/Layout';
import { HomePage } from './common/pages/HomePage';
import { MenuPage } from './common/pages/MenuPage';
import { RegionalProvider } from './common/regional/RegionalProvider';
import { RedirectIfAuthenticated } from './modules/auth/components/RedirectIfAuthenticated';
import { RequireAuth } from './modules/auth/components/RequireAuth';
import { AuthProvider } from './modules/auth/context/AuthProvider';
import { LoginPage } from './modules/auth/pages/LoginPage';
import { RegisterPage } from './modules/auth/pages/RegisterPage';
import { CreateTaskPage } from './modules/tasks/pages/CreateTaskPage';
import { CreateTaskViewPage } from './modules/tasks/pages/CreateTaskViewPage';
import { SearchResultsPage } from './modules/tasks/pages/SearchResultsPage';
import { TaskDetailsPage } from './modules/tasks/pages/TaskDetailsPage';
import { TasksPage } from './modules/tasks/pages/TasksPage';
import { ViewTasksPage } from './modules/tasks/pages/ViewTasksPage';
import { TASKS_CHILD_PATHS, routes } from './routes';

// Provides the client root that supplies shared theme tokens to every page.
function App() {
  return (
    <div className="client">
      <AuthProvider authApi={authApi} authClient={authClient} session={authSession}>
        <BackendClientProvider factory={backendClientFactory}>
          <RegionalProvider clock={regionalClock} settings={regionalSettings}>
            <BrowserRouter>
              <Routes>
                <Route
                  element={
                    <Layout addActionTrees={ADD_ACTION_TREES}>
                      <Outlet />
                    </Layout>
                  }
                >
                  <Route element={<RedirectIfAuthenticated />}>
                    <Route element={<LoginPage />} path={routes.login} />
                    <Route element={<RegisterPage />} path={routes.register} />
                  </Route>
                  <Route element={<RequireAuth />}>
                    <Route element={<HomePage />} index />
                    {/* The static `views/new` outranks `views/:viewId`. */}
                    <Route element={<TasksPage />} path={routes.tasks.root}>
                      <Route element={<SearchResultsPage />} path={TASKS_CHILD_PATHS.search} />
                      <Route element={<CreateTaskViewPage />} path={TASKS_CHILD_PATHS.createView} />
                      <Route element={<CreateTaskPage />} path={TASKS_CHILD_PATHS.createTask} />
                      <Route element={<ViewTasksPage />} path={TASKS_CHILD_PATHS.view} />
                      <Route element={<TaskDetailsPage />} path={TASKS_CHILD_PATHS.task} />
                    </Route>
                    <Route element={<h1>notes</h1>} path={`${routes.notes.root}/*`} />
                    <Route element={<h1>expenses</h1>} path={`${routes.expenses.root}/*`} />
                    <Route element={<MenuPage />} path={`${routes.menu}/*`} />
                  </Route>
                </Route>
              </Routes>
            </BrowserRouter>
          </RegionalProvider>
        </BackendClientProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
