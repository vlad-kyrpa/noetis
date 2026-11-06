import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom';
import { authApi, authSession } from './app/composition';
import { HttpMethodsProvider } from './common/api/HttpMethodsProvider';
import { http } from './common/api/http';
import { Layout } from './common/components/Layout/Layout';
import { HomePage } from './common/pages/HomePage';
import { MenuPage } from './common/pages/MenuPage';
import { RedirectIfAuthenticated } from './modules/auth/components/RedirectIfAuthenticated';
import { RequireAuth } from './modules/auth/components/RequireAuth';
import { AuthProvider } from './modules/auth/context/AuthProvider';
import { LoginPage } from './modules/auth/pages/LoginPage';
import { RegisterPage } from './modules/auth/pages/RegisterPage';
import { routes } from './routes';

// Provides the client root that supplies shared theme tokens to every page.
function App() {
  return (
    <div className="client">
      <HttpMethodsProvider methods={http}>
        <AuthProvider authApi={authApi} session={authSession}>
          <BrowserRouter>
            <Routes>
              <Route
                element={
                  <Layout>
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
                  <Route element={<h1>tasks</h1>} path={`${routes.tasks.root}/*`} />
                  <Route element={<h1>notes</h1>} path={`${routes.notes.root}/*`} />
                  <Route element={<h1>expenses</h1>} path={`${routes.expenses.root}/*`} />
                  <Route element={<MenuPage />} path={`${routes.menu}/*`} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </HttpMethodsProvider>
    </div>
  );
}

export default App;
