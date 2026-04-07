import { useState, useEffect } from "react";

import img0 from "@assets/luxarna.jpeg";
import img1 from "@assets/luxarna 2.jpeg";
import img2 from "@assets/luxarna 3 .jpeg";
import img3 from "@assets/luxarna 4.jpeg";
import img4 from "@assets/luxarna 5.jpeg";
import img5 from "@assets/luxarna 6.jpeg";
import img6 from "@assets/luxarna 7.jpeg";
import img7 from "@assets/luxarna 8.jpeg";
import img8 from "@assets/luxarna 9.jpeg";

const images = [img0, img1, img2, img3, img4, img5, img6, img7, img8];

export default function GallerySection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-20 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4">

        {/* Section Heading */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-serif text-[#D4AF37] tracking-widest uppercase mb-4">
            Our Gallery
          </h2>
          <div className="h-1 w-24 bg-[#D4AF37] mx-auto opacity-50" />
        </div>

        {/* Slideshow */}
        <div className="relative w-full h-[400px] md:h-[600px] overflow-hidden rounded-lg border border-[#D4AF37]/20 shadow-2xl">
          {images.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentIndex ? "opacity-100" : "opacity-0"
              }`}
            >
              <img
                src={image}
                alt={`Luxarna Gallery ${index + 1}`}
                className="w-full h-full object-cover"
                data-testid={`gallery-image-${index}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          ))}

          {/* Navigation Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                data-testid={`gallery-dot-${index}`}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  index === currentIndex
                    ? "bg-[#D4AF37] w-8"
                    : "bg-white/30 w-4"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
