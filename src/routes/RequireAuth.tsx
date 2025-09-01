import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { tokenStore } from '../lib/tokenStore';

export default function RequireAuth() {
  const loc = useLocation();
  return tokenStore.isAuthed()
    ? <Outlet/>
    : <Navigate to="/" replace state={{ from: loc }} />;
}
