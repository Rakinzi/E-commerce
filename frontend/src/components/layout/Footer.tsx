import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, Facebook, Twitter, Instagram, Globe } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function Footer() {
  const { currency, setCurrency } = useCurrency();
  
  const quickLinks = [
    { name: 'Products', href: '/products' },
    { name: 'Categories', href: '/categories' },
    { name: 'About Us', href: '/about' },
    { name: 'Contact', href: '/contact' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
  ];

  const branches = [
    {
      name: 'Harare',
      address: '123 Main Street, Harare',
      phone: '+263 78 668 0563',
      hours: 'Mon-Fri: 8:00 AM - 6:00 PM, Sat: 8:00 AM - 4:00 PM'
    },
    {
      name: 'Mutare',
      address: '456 Second Avenue, Mutare',
      phone: '+263 78 668 0564',
      hours: 'Mon-Fri: 8:00 AM - 6:00 PM, Sat: 8:00 AM - 4:00 PM'
    },
    {
      name: 'Bulawayo',
      address: '789 Third Road, Bulawayo',
      phone: '+263 78 668 0565',
      hours: 'Mon-Fri: 8:00 AM - 6:00 PM, Sat: 8:00 AM - 4:00 PM'
    }
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                <span className="text-gray-900 text-sm font-bold">E</span>
              </div>
              <span className="font-bold text-xl">Commerce</span>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Your trusted partner for quality products and exceptional service. 
              We connect customers with the best vendors worldwide.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Globe className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <span className="text-gray-300">+263 78 668 0563</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <span className="text-gray-300">sales@chinesepartssolutions.co.zw</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <span className="text-gray-300">Zimbabwe</span>
              </div>
            </div>
          </div>

          {/* Branch Hours */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Opening Hours</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="text-gray-300">
                  <div className="font-medium">Monday - Friday</div>
                  <div>8:00 AM - 6:00 PM</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="text-gray-300">
                  <div className="font-medium">Saturday</div>
                  <div>8:00 AM - 4:00 PM</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="text-gray-300">
                  <div className="font-medium">Sunday</div>
                  <div>Closed</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Branches Section */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <h3 className="text-2xl font-bold mb-8 text-center">Our Branches</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {branches.map((branch) => (
              <div key={branch.name} className="bg-gray-800 p-6 rounded-lg">
                <h4 className="text-xl font-bold mb-4 text-white">{branch.name}</h4>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <span className="text-gray-300">{branch.address}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-300">{branch.phone}</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                    <span className="text-gray-300 text-sm">{branch.hours}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-400 text-sm">
            © 2024 E-Commerce Platform. All rights reserved.
          </div>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <span className="text-gray-400 text-sm">Currency:</span>
            <select 
              value={currency} 
              onChange={(e) => setCurrency(e.target.value as 'USD' | 'ZWG')}
              className="bg-gray-800 text-white border border-gray-700 rounded px-3 py-1 text-sm focus:outline-none focus:border-gray-500"
            >
              <option value="USD">USD ($)</option>
              <option value="ZWG">ZWG (ZW$)</option>
            </select>
          </div>
        </div>
      </div>
    </footer>
  );
}