import { useEffect } from 'react';

const DEFAULT_TITLE = 'Commerce - Premium E-commerce Platform';
const TITLE_SEPARATOR = ' | ';

export function usePageTitle(title?: string) {
  useEffect(() => {
    if (title) {
      document.title = `${title}${TITLE_SEPARATOR}${DEFAULT_TITLE}`;
    } else {
      document.title = DEFAULT_TITLE;
    }

    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title]);
}

// Helper function to generate SEO-friendly titles
export function generatePageTitle(page: string, subtitle?: string): string {
  const parts = [page];
  if (subtitle) {
    parts.push(subtitle);
  }
  return parts.join(TITLE_SEPARATOR);
}

// Common page titles
export const PAGE_TITLES = {
  HOME: 'Shop Simple. Shop Smart.',
  PRODUCTS: 'Premium Products',
  CATEGORIES: 'Shop by Category',
  CART: 'Shopping Cart',
  CHECKOUT: 'Secure Checkout',
  LOGIN: 'Sign In',
  REGISTER: 'Create Account',
  VERIFY_EMAIL: 'Verify Email',
  FORGOT_PASSWORD: 'Forgot Password',
  RESET_PASSWORD: 'Reset Password',
  PROFILE: 'My Profile',
  ORDERS: 'My Orders',
  ADMIN: 'Admin Dashboard',
  VENDOR: 'Vendor Dashboard',
  ABOUT: 'About Us',
  CONTACT: 'Contact Us',
  HELP: 'Help & Support',
  PRIVACY: 'Privacy Policy',
  TERMS: 'Terms of Service',
} as const;