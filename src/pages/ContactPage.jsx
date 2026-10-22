// pages/ContactPage.jsx
import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Instagram, Facebook, MessageCircle, ExternalLink, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { getAllSettings } from '../api.js';
import GoogleMapEmbed from '../components/GoogleMapEmbed.jsx';

export default function ContactPage() {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    getAllSettings()
      .then(data => setSettings(data || {}))
      .catch(e => console.error('Error fetching settings in ContactPage:', e));
  }, []);

  const cleanPhone = (settings.store_phone || settings.store_whatsapp || '').replace(/[^0-9+]/g, '');
  const cleanWhatsapp = (settings.store_whatsapp || settings.store_phone || '').replace(/[^0-9]/g, '');

  const instagramUrl = settings.store_instagram
    ? (settings.store_instagram.startsWith('http') ? settings.store_instagram : `https://instagram.com/${settings.store_instagram.replace('@', '')}`)
    : null;

  const facebookUrl = settings.store_facebook
    ? (settings.store_facebook.startsWith('http') ? settings.store_facebook : `https://facebook.com/${settings.store_facebook}`)
    : null;

  const contactCards = [
    {
      id: 'phone',
      label: 'Téléphone (اتصال مباشر)',
      value: settings.store_phone || 'Non renseigné',
      href: settings.store_phone ? `tel:${cleanPhone}` : null,
      icon: <Phone size={22} />,
      color: '#111827',
      bg: '#f3f4f6',
      btnText: 'Appeler maintenant',
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp (محادثة واتساب)',
      value: settings.store_whatsapp || settings.store_phone || 'Non renseigné',
      href: cleanWhatsapp ? `https://wa.me/${cleanWhatsapp}` : null,
      icon: <MessageCircle size={22} />,
      color: '#16a34a',
      bg: '#ecfdf5',
      btnText: 'Ouvrir WhatsApp',
    },
    {
      id: 'instagram',
      label: 'Instagram (انستغرام)',
      value: settings.store_instagram || 'Non renseigné',
      href: instagramUrl,
      icon: <Instagram size={22} />,
      color: '#e1306c',
      bg: '#fdf2f8',
      btnText: 'Voir le profil',
    },
    {
      id: 'facebook',
      label: 'Facebook (فيسبوك)',
      value: settings.store_facebook || 'Non renseigné',
      href: facebookUrl,
      icon: <Facebook size={22} />,
      color: '#1877f2',
      bg: '#eff6ff',
      btnText: 'Visiter la page',
    },
    {
      id: 'email',
      label: 'Email (البريد الإلكتروني)',
      value: settings.store_email || 'Non renseigné',
      href: settings.store_email ? `mailto:${settings.store_email}` : null,
      icon: <Mail size={22} />,
      color: '#4b5563',
      bg: '#f9fafb',
      btnText: 'Envoyer un email',
    },
    {
      id: 'address',
      label: 'Adresse du Magasin (عنوان المحل)',
      value: settings.store_address || 'Alger, Algérie',
      href: '#store-map',
      icon: <MapPin size={22} />,
      color: '#b45309',
      bg: '#fef3c7',
      btnText: 'Voir sur la carte',
    },
  ];

  return (
    <main>
      <div className="page-header">
        <div className="container">
          <h1>Contactez-nous</h1>
          <div className="breadcrumb">
            <a href="/">Shop</a>
            <span>/</span>
            <span>Contact</span>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '48px 24px 64px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>
              Nous sommes à votre écoute
            </h2>
            <p style={{ color: 'var(--gray)', fontSize: 16, maxWidth: 560, margin: '0 auto' }}>
              Pour toute question, commande ou conseil, cliquez sur l'un des moyens de contact ci-dessous pour nous joindre directement :
            </p>
          </div>

          {/* Interactive Contact Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 16,
            marginBottom: 48
          }}>
            {contactCards.map(c => {
              const Tag = c.href ? 'a' : 'div';
              return (
                <Tag
                  key={c.id}
                  href={c.href || undefined}
                  target={c.href && c.href.startsWith('http') ? '_blank' : undefined}
                  rel={c.href && c.href.startsWith('http') ? 'noreferrer' : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '18px 20px',
                    background: 'var(--white)',
                    border: '1px solid var(--gray-border)',
                    borderRadius: 8,
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.2s ease',
                    cursor: c.href ? 'pointer' : 'default'
                  }}
                  className="contact-card-link"
                >
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    background: c.bg,
                    color: c.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {c.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray)' }}>{c.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--black)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.value}
                    </div>
                  </div>
                  {c.href && (
                    <ExternalLink size={16} style={{ color: 'var(--gray-light)', flexShrink: 0 }} />
                  )}
                </Tag>
              );
            })}
          </div>

          {/* Store Hours */}
          <div style={{
            padding: '24px 28px',
            background: 'var(--white)',
            border: '1px solid var(--gray-border)',
            borderRadius: 8,
            marginBottom: 48,
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            flexWrap: 'wrap'
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              background: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--black)'
            }}>
              <Clock size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 4px' }}>
                Horaires d'Ouverture du Magasin / أوقات العمل
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--gray)' }}>
                السبت – الخميس: 09:00 صباحاً – 21:00 مساءً | الجمعة: بعد صلاة الجمعة – 22:00 مساءً
              </p>
            </div>
          </div>

          {/* Google Map Section */}
          <div id="store-map" style={{ scrollMarginTop: 80 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <MapPin size={22} style={{ color: 'var(--black)' }} />
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>
                  Notre Emplacement / موقع المحل على الخريطة
                </h3>
                {settings.store_address && (
                  <p style={{ fontSize: 13, color: 'var(--gray)', margin: '2px 0 0' }}>
                    {settings.store_address}
                  </p>
                )}
              </div>
            </div>

            {settings.store_map_embed ? (
              <GoogleMapEmbed embedCodeOrUrl={settings.store_map_embed} height={420} />
            ) : (
              <div style={{
                padding: '48px 24px',
                textAlign: 'center',
                background: 'var(--white)',
                border: '1px dashed var(--gray-border)',
                borderRadius: 8,
                color: 'var(--gray)'
              }}>
                <MapPin size={36} style={{ opacity: 0.4, margin: '0 auto 10px', display: 'block' }} />
                <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>
                  يمكنك تحديد وتعديل رابط خريطة المحل (Google Maps Embed) من لوحة تحكم الأدمن (الإعدادات) ليظهر هنا مباشرة.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
