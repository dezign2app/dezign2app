import { AuthLayout } from '@/app/(auth)/_components/ui/layouts/auth-layout';
import React, { ReactNode } from 'react';

const Layout = ({ children }: { children: ReactNode }) => {
  return <AuthLayout>{children}</AuthLayout>;
};

export default Layout;
