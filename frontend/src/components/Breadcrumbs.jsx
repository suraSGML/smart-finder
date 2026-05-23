import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Breadcrumbs = () => {
  const location = useLocation();
  const { t } = useTranslation();

  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  const breadcrumbMap = {
    search: t('search.title'),
    products: t('common.products'),
    shops: t('common.shops'),
    map: t('common.map'),
    dashboard: t('common.dashboard'),
    'shop-dashboard': t('common.dashboard'),
    'admin-dashboard': t('common.dashboard'),
  };

  return (
    <nav className="bg-gray-50 dark:bg-gray-900 px-4 py-3 mb-6 rounded-lg">
      <ol className="flex items-center space-x-2 text-sm">
        <li>
          <Link
            to="/"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
          >
            <Home size={16} className="mr-1" />
            {t('common.home')}
          </Link>
        </li>

        {pathnames.map((name, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const displayName = breadcrumbMap[name] || name.charAt(0).toUpperCase() + name.slice(1);

          return (
            <li key={routeTo} className="flex items-center">
              <ChevronRight size={16} className="mx-2 text-gray-400" />
              {isLast ? (
                <span className="text-gray-600 dark:text-gray-400">{displayName}</span>
              ) : (
                <Link
                  to={routeTo}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {displayName}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
