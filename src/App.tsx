import { ThemeProvider } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ClientRegistration from './components/ClientRegistration';
import AutomaticSending from './components/AutomaticSending';
import APIConfiguration from './components/APIConfiguration';
import Dashboard from './components/Dashboard';
import ClientList from './components/ClientList';
import { theme } from './theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/client-registration" element={<ClientRegistration />} />
            <Route path="/clients" element={<ClientList />} />
            <Route path="/automatic-sending" element={<AutomaticSending />} />
            <Route path="/settings" element={<APIConfiguration />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
