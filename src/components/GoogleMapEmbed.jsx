// src/components/GoogleMapEmbed.jsx
import React from 'react';
import { MapPin } from 'lucide-react';

export default function GoogleMapEmbed({ embedCodeOrUrl, height = 380, title = 'Notre Emplacement' }) {
  if (!embedCodeOrUrl || !embedCodeOrUrl.trim()) {
    return null;
  }

  let src = embedCodeOrUrl.trim();
  // If user pasted full <iframe ... src="..." ...></iframe>
  if (src.includes('<iframe')) {
    const match = src.match(/src=["'](.*?)["']/);
    if (match && match[1]) {
      src = match[1];
    }
  }

  return (
    <div className="google-map-wrapper" style={{ width: '100%', overflow: 'hidden', borderRadius: 8, border: '1px solid var(--gray-border)', background: '#f5f5f5' }}>
      <iframe
        src={src}
        width="100%"
        height={height}
        style={{ border: 0, display: 'block' }}
        allowFullScreen=""
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={title}
      />
    </div>
  );
}
