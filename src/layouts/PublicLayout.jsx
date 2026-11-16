import { Outlet } from 'react-router-dom';

/**
 * Layout wrapper for public-facing pages.
 */
export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-white">
      <Outlet />
    </div>
  );
}

