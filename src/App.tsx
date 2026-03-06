import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import AdminPage from '@/pages/AdminPage';
import SchadensmeldungPage from '@/pages/SchadensmeldungPage';
import SchadenskategorienPage from '@/pages/SchadenskategorienPage';
import BearbeitungsstatusPage from '@/pages/BearbeitungsstatusPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="schadensmeldung" element={<SchadensmeldungPage />} />
          <Route path="schadenskategorien" element={<SchadenskategorienPage />} />
          <Route path="bearbeitungsstatus" element={<BearbeitungsstatusPage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}