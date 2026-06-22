import { NavLink } from 'react-router-dom';
import { useAuth } from '@/lib/auth/auth-context';
import styles from './Sidebar.module.css';

interface NavItem {
  to: string;
  label: string;
  roles: string[];
}

const navItems: NavItem[] = [
  { to: '/super-admin/admins', label: 'Adminlar', roles: ['super_admin'] },
  { to: '/admin/tenants', label: 'Do\'konlar', roles: ['admin'] },
  { to: '/admin/cashiers', label: 'Kassirlar', roles: ['admin'] },
  { to: '/admin/products', label: 'Mahsulotlar', roles: ['admin'] },
  { to: '/admin/reports', label: 'Hisobotlar', roles: ['admin'] },
  { to: '/pos', label: 'POS', roles: ['cashier'] },
  { to: '/orders', label: 'Buyurtmalar', roles: ['cashier', 'admin', 'super_admin'] },
];

export function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;

  const items = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.logo}>BITO</span>
        <span className={styles.subtitle}>POS Admin</span>
      </div>
      <nav className={styles.nav}>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
