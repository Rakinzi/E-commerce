import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselItem {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  description?: string;
  cta?: {
    text: string;
    link: string;
  };
}

interface CarouselProps {
  items: CarouselItem[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  className?: string;
}

export function Carousel({ 
  items, 
  autoPlay = true, 
  autoPlayInterval = 5000,
  className = "" 
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === items.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? items.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  useEffect(() => {
    if (autoPlay) {
      const interval = setInterval(nextSlide, autoPlayInterval);
      return () => clearInterval(interval);
    }
  }, [autoPlay, autoPlayInterval, currentIndex]);

  if (items.length === 0) return null;

  return (
    <div className={`relative w-full h-96 md:h-[500px] lg:h-[600px] overflow-hidden ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -300 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <div className="relative w-full h-full">
            <img
              src={items[currentIndex].image}
              alt={items[currentIndex].title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/60"></div>
            
            {/* Content Overlay */}
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-7xl mx-auto px-8 md:px-12 lg:px-16">
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="max-w-2xl"
                >
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-4 leading-tight tracking-tighter">
                    {items[currentIndex].title}
                  </h1>
                  {items[currentIndex].subtitle && (
                    <h2 className="text-2xl md:text-3xl font-extralight text-white/80 mb-6 tracking-widest">
                      {items[currentIndex].subtitle}
                    </h2>
                  )}
                  {items[currentIndex].description && (
                    <p className="text-xl text-white/90 mb-8 leading-relaxed font-light">
                      {items[currentIndex].description}
                    </p>
                  )}
                  {items[currentIndex].cta && (
                    <motion.a
                      href={items[currentIndex].cta!.link}
                      className="inline-block bg-white text-black px-8 py-4 text-lg font-bold uppercase tracking-wide hover:bg-gray-100 rounded-none transform transition-all duration-300 hover:scale-105"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {items[currentIndex].cta!.text}
                    </motion.a>
                  )}
                  <div className="w-24 h-1 bg-white mt-8"></div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 md:left-8 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-300 flex items-center justify-center group"
      >
        <ChevronLeft className="h-6 w-6 transform group-hover:-translate-x-1 transition-transform" />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-4 md:right-8 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-300 flex items-center justify-center group"
      >
        <ChevronRight className="h-6 w-6 transform group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Dots Navigation */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 transition-all duration-300 ${
              index === currentIndex 
                ? 'bg-white w-8' 
                : 'bg-white/50 hover:bg-white/70'
            }`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-white/20">
        <motion.div
          className="h-full bg-white"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ 
            duration: autoPlayInterval / 1000,
            ease: "linear",
            repeat: Infinity 
          }}
          key={currentIndex}
        />
      </div>
    </div>
  );
}

export default Carousel;