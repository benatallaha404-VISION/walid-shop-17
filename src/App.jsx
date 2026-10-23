// App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';
import Header from './components/Header.jsx';
import MobileBottomNav from './components/MobileBottomNav.jsx';
import ToastContainer from './components/Toast.jsx';
import ShopPage from './pages/ShopPage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import AdminPage from './pages/AdminPage.jsx';

function AppLayout({ children }) {
  return (
    <>
      <Header />
      {children}
      <MobileBottomNav />
      <ToastContainer />
    </>
  );
}

function AdminLayout({ children }) {
  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/" element={<AppLayout><ShopPage /></AppLayout>} />
          <Route path="/product/:id" element={<AppLayout><ProductDetailPage /></AppLayout>} />
          <Route path="/checkout" element={<AppLayout><CheckoutPage /></AppLayout>} />
          <Route path="/contact" element={<AppLayout><ContactPage /></AppLayout>} />
          <Route path="/admin" element={<AdminLayout><AdminPage /></AdminLayout>} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
