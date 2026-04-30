import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, LogOut } from 'lucide-react';
import { useAuth } from '../AuthContext';
import toast from 'react-hot-toast';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/projects', icon: FolderKanban, label: 'Projects' },
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>⬡ TaskFlow</h1>
          <span>// team task manager</span>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-title">Navigation</div>
          {navItems.map(({ path, icon: Icon, label }) => (
            <button
              key={path}
              className={`nav-item ${location.pathname === path || (path !== '/' && location.pathname.startsWith(path)) ? 'active' : ''}`}
              onClick={() => navigate(path)}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
            <div style={{flex:1, minWidth:0}}>
              <div className="user-name" style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{user?.name}</div>
              <div className="user-email" style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{user?.email}</div>
            </div>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={handleLogout} title="Logout">
              <LogOut size={13}/>
            </button>
          </div>
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
