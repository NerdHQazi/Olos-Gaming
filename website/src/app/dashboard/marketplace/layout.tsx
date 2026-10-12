import { ReactNode } from 'react';
import AppFooter from '@/components/app/AppFooter';

type MarketplaceLayoutProps = {
  children: ReactNode;
};

export default function MarketplaceLayout({ children }: MarketplaceLayoutProps) {
  return (
    <>
      {children}
      <AppFooter />
    </>
  );
}
