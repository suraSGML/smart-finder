import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

NProgress.configure({ showSpinner: false });

const ProgressBar = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    NProgress.start();

    const timer = setTimeout(() => {
      setIsLoading(false);
      NProgress.done();
    }, 500);

    return () => clearTimeout(timer);
  }, [location]);

  return null;
};

export default ProgressBar;
