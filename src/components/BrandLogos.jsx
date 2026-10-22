// src/components/BrandLogos.jsx
import React from 'react';

export const BRAND_LOGOS = [
  { name: 'Nike', src: '/brand-logos/nike.svg', height: 26 },
  { name: 'Adidas', src: '/brand-logos/adidas.svg', height: 30 },
  { name: 'Lacoste', src: '/brand-logos/lacoste.svg', height: 36 },
  { name: 'Tommy Hilfiger', src: '/brand-logos/tommy.svg', height: 26 },
  { name: 'Puma', src: '/brand-logos/puma.svg', height: 26 },
  { name: 'BOSS', src: '/brand-logos/boss.svg', height: 22 },
  { name: 'Zara', src: '/brand-logos/zara.svg', height: 22 },
  
];

export default function BrandLogosTicker() {
  // Repeat array to ensure seamless infinite horizontal loop
  const items = [...BRAND_LOGOS, ...BRAND_LOGOS, ...BRAND_LOGOS, ...BRAND_LOGOS];

  return (
    <div className="brands-ticker" id="brands-ticker-bar" title="الماركات العالمية المتوفرة">
      <div className="brands-track">
        {items.map((brand, i) => (
          <div
            key={`${brand.name}-${i}`}
            className="brand-logo-item"
            title={`ماركة ${brand.name}`}
          >
            <img
              src={brand.src}
              alt={brand.name}
              style={{ height: `${brand.height}px`, width: 'auto', display: 'block' }}
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
