import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface SubCategory {
  name: string;
  href: string;
  description?: string;
}

interface Category {
  name: string;
  href: string;
  description?: string;
  subcategories: SubCategory[];
}

interface MegaMenuProps {
  categories: Category[];
}

export default function MegaMenu({ categories }: MegaMenuProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  return (
    <div className="relative">
      <nav className="hidden lg:flex items-center space-x-8">
        {categories.map((category) => (
          <div
            key={category.name}
            className="relative group"
            onMouseEnter={() => setActiveCategory(category.name)}
            onMouseLeave={() => setActiveCategory(null)}
          >
            <Link
              to={category.href}
              className="flex items-center space-x-1 text-gray-900 hover:text-gray-600 font-medium transition-colors py-2"
            >
              <span>{category.name}</span>
              <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
            </Link>

            <AnimatePresence>
              {activeCategory === category.name && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="fixed top-[120px] left-1/2 transform -translate-x-1/2 z-50"
                >
                  <div className="bg-white border border-gray-200 shadow-2xl rounded-lg overflow-hidden w-[1000px] max-w-[90vw]">
                    <div className="p-8">
                      {/* Category Header */}
                      <div className="mb-6 pb-4 border-b border-gray-100">
                        <h3 className="text-2xl font-bold text-black mb-2">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-gray-600">{category.description}</p>
                        )}
                      </div>

                      {/* Subcategories Grid */}
                      <div className="grid grid-cols-3 gap-8">
                        {category.subcategories.map((subcategory, index) => (
                          <motion.div
                            key={subcategory.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                          >
                            <Link
                              to={subcategory.href}
                              className="block group p-4 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <h4 className="text-lg font-semibold text-black mb-2 group-hover:text-gray-700 transition-colors">
                                {subcategory.name}
                              </h4>
                              {subcategory.description && (
                                <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
                                  {subcategory.description}
                                </p>
                              )}
                            </Link>
                          </motion.div>
                        ))}
                      </div>

                      {/* View All Link */}
                      <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                        <Link
                          to={category.href}
                          className="inline-flex items-center text-black font-medium hover:text-gray-600 transition-colors"
                        >
                          View All {category.name}
                          <ChevronDown className="ml-1 h-4 w-4 -rotate-90" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>
    </div>
  );
}