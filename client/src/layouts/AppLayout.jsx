import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const AppLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9ff] dark:bg-[#061324] text-[#0b1c30] dark:text-[#eaf1ff] transition-colors duration-200">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default AppLayout;
