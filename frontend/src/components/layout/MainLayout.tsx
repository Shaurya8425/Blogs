import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className='min-h-screen bg-gray-50 flex flex-col'>
      <Navbar />
      <main className='flex-grow py-12 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-7xl mx-auto'>{children}</div>
      </main>
      <Footer />
    </div>
  );
};
