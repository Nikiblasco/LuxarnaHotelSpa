import { useState, useEffect } from "react";

import img0 from "@assets/luxarna.jpeg";
import img1 from "@assets/luxarna 2.jpeg";
import img2 from "@assets/luxarna 3 .jpeg";
import img3 from "@assets/luxarna 4.jpeg";
import img4 from "@assets/luxarna 5.jpeg";
import img6 from "@assets/luxarna 7.jpeg";
import img7 from "@assets/luxarna 8.jpeg";
import img8 from "@assets/luxarna 9.jpeg";

const images = [img0, img1, img2, img3, img4, img6, img7, img8];

export default function GallerySection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-24 bg-[#050505]">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-[#D4AF37] text-sm uppercase tracking-[0.3em] font-light mb-2 block">Experience Excellence</span>
          <h2 className="text-5xl md:text-6xl font-serif text-white tracking-tight mb-6">
            Our <span className="italic text-[#D4AF37]">Gallery</span>
          </h2>
          <div className="flex justify-center items-center gap-4">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#D4AF37]" />
            <div className="w-2 h-2 rotate-45 border border-[#D4AF37]" />
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#D4AF37]" />
          </div>
        </div>

        {/* Slideshow Container */}
        <div className="relative w-full h-[500px] md:h-[700px] rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.1)] border border-white/10">

          {images.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-[2000ms] ease-in-out ${
                index === currentIndex ? "opacity-100" : "opacity-0"
              }`}
            >
              <img
                src={image}
                alt={`Gallery ${index}`}
                className={`w-full h-full object-cover transition-transform duration-[10000ms] linear ${
                  index === currentIndex ? "scale-110" : "scale-100"
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
            </div>
          ))}

          {/* Navigation */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center space-x-4 px-6 py-3 rounded-full bg-black/20 backdrop-blur-md border border-white/10 z-10">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className="group p-2"
              >
                <div className={`h-[2px] transition-all duration-500 rounded-full ${
                  index === currentIndex ? "w-8 bg-[#D4AF37]" : "w-4 bg-white/40 group-hover:bg-white/70"
                }`} />
              </button>
            ))}
          </div>

          {/* Corner Accents */}
          <div className="absolute top-6 left-6 w-8 h-8 border-t border-l border-[#D4AF37]/50 pointer-events-none" />
          <div className="absolute top-6 right-6 w-8 h-8 border-t border-r border-[#D4AF37]/50 pointer-events-none" />
          <div className="absolute bottom-6 left-6 w-8 h-8 border-b border-l border-[#D4AF37]/50 pointer-events-none" />
          <div className="absolute bottom-6 right-6 w-8 h-8 border-b border-r border-[#D4AF37]/50 pointer-events-none" />
        </div>

      </div>
    </section>
  );
}