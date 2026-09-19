import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { CartDrawer } from './components/layout/CartDrawer';
import { ToastProvider } from './components/ui';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import { useCartStore } from './store/cartStore';
import { useUiStore } from './store/uiStore';
import { Skeleton } from './components/ui';

const HomePage = lazy(() => import('./pages/HomePage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage'));
const StyleGuidePage = lazy(() => import('./pages/StyleGuidePage'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));

function PageLoader() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default function App() {
  const fetchCart = useCartStore((s) => s.fetchCart);
  const setDarkMode = useUiStore((s) => s.setDarkMode);

  useEffect(() => {
    fetchCart().catch(() => {});
    const saved = localStorage.getItem('ecomm-dark') === 'true';
    setDarkMode(saved);
  }, [fetchCart, setDarkMode]);

  useEffect(() => {
    const unsub = useUiStore.subscribe((s) => {
      localStorage.setItem('ecomm-dark', String(s.darkMode));
    });
    return unsub;
  }, []);

  return (
    <HelmetProvider>
      <BrowserRouter>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/:slug" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/order-confirmation/:id" element={<OrderConfirmationPage />} />
                <Route path="/styleguide" element={<StyleGuidePage />} />
                <Route
                  path="/account"
                  element={
                    <ProtectedRoute>
                      <AccountPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/*"
                  element={
                    <AdminRoute>
                      <AdminLayout />
                    </AdminRoute>
                  }
                />
              </Routes>
            </Suspense>
          </main>
          <Footer />
          <CartDrawer />
          <ToastProvider />
        </div>
      </BrowserRouter>
    </HelmetProvider>
  );
}
