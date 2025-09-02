import {Route, Routes } from 'react-router-dom';
import './App.css'
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import RequireAuth from './routes/RequireAuth';

function App() {
  return (
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
  );
}

export default App
