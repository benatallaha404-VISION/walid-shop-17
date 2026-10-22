// src/pages/admin/AdminSettings.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Save, Image, Download, Upload, MapPin, Trash2, Lock, Eye, EyeOff } from 'lucide-react';
import { getAllSettings, setSetting, getSetting, exportDB, importDB, clearAllProducts, compressImage } from '../../db.js';
import { useApp } from '../../context/AppContext.jsx';
import GoogleMapEmbed from '../../components/GoogleMapEmbed.jsx';

export default function AdminSettings() {
  const { addToast } = useApp();
  const [settings, setSettings] = useState({});
  const heroFileRef = useRef();
  const importRef = useRef();
  const [pwOld, setPwOld] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [showPwOld, setShowPwOld] = useState(false);
  const [showPwNew, setShowPwNew] = useState(false);

  useEffect(() => {
    try {
      setSettings(getAllSettings());
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  }, []);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {
    try {
      Object.entries(settings).forEach(([k, v]) => setSetting(k, v));
      addToast('Paramètres sauvegardés avec succès!', 'success');
    } catch (e) {
      console.error('Error saving settings:', e);
      addToast('Erreur lors de la sauvegarde', 'error');
    }
  };

  const handleHeroImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 1920, 1080, 0.85);
      if (compressed) {
        handleSettingChange('hero_image', compressed);
      }
    } catch (err) {
      console.error('Hero image compression error:', err);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await importDB(file);
      addToast('Base de données importée! Rechargement...', 'success');
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      addToast('Erreur lors de l\'importation', 'error');
    }
  };

  const handleClearAllProducts = () => {
    if (window.confirm('Voulez-vous vraiment supprimer TOUS les produits ?\nهل أنت متأكد من حذف جميع المنتجات نهائياً؟ لن تظهر مجدداً ولن يتم إنشاء بيانات وهمية.')) {
      try {
        clearAllProducts();
        addToast('Tous les produits ont été supprimés!', 'success');
      } catch (err) {
        console.error('Error clearing products:', err);
      }
    }
  };

  const handleChangePassword = () => {
    const currentPw = getSetting('admin_password') || 'WALID123';
    if (!pwOld || !pwNew || !pwConfirm) {
      addToast('Veuillez remplir tous les champs.', 'error');
      return;
    }
    if (pwOld !== currentPw) {
      addToast('كلمة المرور الحالية غير صحيحة.', 'error');
      return;
    }
    if (pwNew.length < 4) {
      addToast('كلمة المرور الجديدة يجب أن تكون 4 أحرف على الأقل.', 'error');
      return;
    }
    if (pwNew !== pwConfirm) {
      addToast('كلمات المرور الجديدة غير متطابقة.', 'error');
      return;
    }
    setSetting('admin_password', pwNew);
    addToast('✅ تم تغيير كلمة المرور بنجاح!', 'success');
    setPwOld(''); setPwNew(''); setPwConfirm('');
  };

  const storeFields = [
    { key: 'store_name', label: 'Nom du magasin (اسم المتجر)' },
    { key: 'store_email', label: 'Email du magasin (البريد الإلكتروني)' },
    { key: 'store_phone', label: 'Téléphone (رقم الهاتف)' },
    { key: 'store_whatsapp', label: 'WhatsApp (رقم الواتساب)' },
    { key: 'store_address', label: 'Adresse physique (العنوان الفعلي للمحل)' },
    { key: 'store_instagram', label: 'Compte Instagram (@nom_ou_lien)' },
    { key: 'store_facebook', label: 'Page Facebook (lien)' },
  ];

  const emailFields = [
    { key: 'emailjs_service_id', label: 'EmailJS Service ID' },
    { key: 'emailjs_template_id', label: 'EmailJS Template ID' },
    { key: 'emailjs_public_key', label: 'EmailJS Public Key' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 className="admin-page-title" style={{ margin: 0 }}>Paramètres de la Boutique</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--gray)' }}>
          تحكم في معلومات المتجر، قوقل ماب، البانر، وإشعارات الطلبات.
        </p>
      </div>

      {/* Store Info */}
      <div className="admin-card" style={{ marginBottom: 24 }}>
        <div className="admin-card-header">
          <h3>Informations Générales (بيانات المتجر والتواصل)</h3>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {storeFields.map(f => (
              <div className="form-group" key={f.key} style={{ margin: 0 }}>
                <label style={{ fontSize: 13, fontWeight: 700 }}>{f.label}</label>
                <input
                  className="form-input"
                  value={settings[f.key] || ''}
                  onChange={e => handleSettingChange(f.key, e.target.value)}
                  id={`setting-${f.key}`}
                />
              </div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={saveSettings} style={{ marginTop: 20 }}>
            <Save size={15} /> Sauvegarder les Coordonnées
          </button>
        </div>
      </div>

      {/* Google Maps Location */}
      <div className="admin-card" style={{ marginBottom: 24 }}>
        <div className="admin-card-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MapPin size={18} style={{ color: 'var(--gold)' }} />
          <h3>Localisation Google Maps (موقع المحل عبر خرائط قوقل)</h3>
        </div>
        <div style={{ padding: 20 }}>
          <p style={{ fontSize: 13, color: 'var(--gray)', margin: '0 0 12px' }}>
            ضع رابط أو كود التضمين (iframe embed) من خرائط قوقل. سيظهر موقع المحل مباشرة في صفحة التواصل (Contact) وفي أسفل صفحة المتجر الرئيسية (Notre Emplacement / موقعنا):
          </p>

          <div className="form-group">
            <label style={{ fontSize: 13, fontWeight: 700 }}>
              Lien ou Code Embed Google Maps (كود iframe أو رابط التضمين)
            </label>
            <textarea
              className="form-textarea"
              rows={3}
              value={settings.store_map_embed || ''}
              onChange={e => handleSettingChange('store_map_embed', e.target.value)}
              placeholder='Ex: https://www.google.com/maps/embed?pb=... أو <iframe src="https://www.google.com/maps/embed?..." ...></iframe>'
              id="setting-store-map-embed"
            />
            <span style={{ fontSize: 11, color: 'var(--gray-light)', display: 'block', marginTop: 4 }}>
              طريقة الحصول عليه: افتح موقع المحل في خرائط Google Maps ⟵ اضغط "مشاركة" (Share) ⟵ اختر "تضمين خريطة" (Embed a map) ⟵ انسخ الكود والصقه هنا.
            </span>
          </div>

          {settings.store_map_embed && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--gold-dark)' }}>
                معاينة الخريطة المباشرة (Aperçu de la carte):
              </div>
              <GoogleMapEmbed embedCodeOrUrl={settings.store_map_embed} height={260} />
            </div>
          )}

          <button className="btn btn-primary" onClick={saveSettings} style={{ marginTop: 16 }}>
            <Save size={15} /> Sauvegarder la Localisation
          </button>
        </div>
      </div>

      {/* Hero Settings */}
      <div className="admin-card" style={{ marginBottom: 24 }}>
        <div className="admin-card-header">
          <h3>Bannière d'Accueil (Hero Section)</h3>
        </div>
        <div style={{ padding: 20 }}>
          <div className="form-group">
            <label style={{ fontSize: 13, fontWeight: 700 }}>Titre Principal (utilisez \n pour aller à la ligne)</label>
            <input
              className="form-input"
              value={settings.hero_title || ''}
              onChange={e => handleSettingChange('hero_title', e.target.value)}
              id="setting-hero-title"
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: 13, fontWeight: 700 }}>Badge / Tag</label>
            <input
              className="form-input"
              value={settings.hero_tag || ''}
              onChange={e => handleSettingChange('hero_tag', e.target.value)}
              id="setting-hero-tag"
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: 13, fontWeight: 700 }}>Sous-titre</label>
            <textarea
              className="form-textarea"
              value={settings.hero_subtitle || ''}
              onChange={e => handleSettingChange('hero_subtitle', e.target.value)}
              rows={2}
              id="setting-hero-subtitle"
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: 13, fontWeight: 700 }}>Image d'Arrière-plan</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              {settings.hero_image && (
                <img src={settings.hero_image} alt="Preview" style={{ width: 100, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--gray-border)' }} />
              )}
              <button type="button" className="btn btn-outline" onClick={() => heroFileRef.current.click()}>
                <Image size={15} /> Téléverser une image
              </button>
              {settings.hero_image && (
                <button type="button" className="btn btn-danger btn-sm" onClick={() => handleSettingChange('hero_image', '')}>
                  Supprimer
                </button>
              )}
              <input ref={heroFileRef} type="file" accept="image/*" onChange={handleHeroImage} style={{ display: 'none' }} />
            </div>

            <p style={{ fontSize: 12, color: 'var(--gray)', margin: '8px 0 4px' }}>Ou entrez un lien URL direct:</p>
            <input
              className="form-input"
              value={settings.hero_image || ''}
              onChange={e => handleSettingChange('hero_image', e.target.value)}
              placeholder="https://images.unsplash.com/..."
              id="setting-hero-image-url"
            />
          </div>

          <button className="btn btn-primary" onClick={saveSettings}>
            <Save size={15} /> Sauvegarder la Bannière
          </button>
        </div>
      </div>

      {/* EmailJS Settings */}
      <div className="admin-card" style={{ marginBottom: 24 }}>
        <div className="admin-card-header">
          <h3>Notifications de Commande (EmailJS)</h3>
        </div>
        <div style={{ padding: 20 }}>
          <p style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 16 }}>
            Configurez EmailJS pour recevoir une notification par email à chaque nouvelle commande. Créez un compte gratuit sur{' '}
            <a href="https://emailjs.com" target="_blank" rel="noreferrer" style={{ color: 'var(--gold-dark)', fontWeight: 700 }}>
              emailjs.com
            </a>
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {emailFields.map(f => (
              <div className="form-group" key={f.key} style={{ margin: 0 }}>
                <label style={{ fontSize: 13, fontWeight: 700 }}>{f.label}</label>
                <input
                  className="form-input"
                  value={settings[f.key] || ''}
                  onChange={e => handleSettingChange(f.key, e.target.value)}
                  id={`setting-${f.key}`}
                />
              </div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={saveSettings} style={{ marginTop: 20 }}>
            <Save size={15} /> Sauvegarder EmailJS
          </button>
        </div>
      </div>

      {/* Change Admin Password */}
      <div className="admin-card" style={{ marginBottom: 24 }}>
        <div className="admin-card-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lock size={18} style={{ color: 'var(--gold)' }} />
          <h3>كلمة سر لوحة التحكم (Mot de passe Admin)</h3>
        </div>
        <div style={{ padding: 20 }}>
          <p style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 16 }}>
            يمكنك تغيير كلمة مرور الدخول إلى لوحة التحكم. كلمة المرور الافتراضية هي <strong>WALID123</strong>.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, maxWidth: 720 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 13, fontWeight: 700 }}>كلمة المرور الحالية</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showPwOld ? 'text' : 'password'}
                  value={pwOld}
                  onChange={e => setPwOld(e.target.value)}
                  id="setting-pw-old"
                  style={{ paddingRight: 40 }}
                />
                <button type="button" onClick={() => setShowPwOld(p => !p)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray)' }}>
                  {showPwOld ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 13, fontWeight: 700 }}>كلمة المرور الجديدة</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showPwNew ? 'text' : 'password'}
                  value={pwNew}
                  onChange={e => setPwNew(e.target.value)}
                  id="setting-pw-new"
                  style={{ paddingRight: 40 }}
                />
                <button type="button" onClick={() => setShowPwNew(p => !p)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray)' }}>
                  {showPwNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 13, fontWeight: 700 }}>تأكيد كلمة المرور الجديدة</label>
              <input
                className="form-input"
                type="password"
                value={pwConfirm}
                onChange={e => setPwConfirm(e.target.value)}
                id="setting-pw-confirm"
              />
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleChangePassword} style={{ marginTop: 20 }}>
            <Lock size={15} /> تغيير كلمة المرور
          </button>
        </div>
      </div>

      {/* Backup, Clean & Restore */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Sauvegarde &amp; Nettoyage des Données</h3>
        </div>
        <div style={{ padding: 20 }}>
          <p style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 16 }}>
            Exportez votre base de données pour une sauvegarde complète, ou importez une sauvegarde précédente.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            <button className="btn btn-outline" onClick={exportDB} id="export-db-btn">
              <Download size={15} /> Exporter la BDD (.sqlite)
            </button>
            <button className="btn btn-ghost" onClick={() => importRef.current.click()} id="import-db-btn">
              <Upload size={15} /> Importer une sauvegarde
            </button>
            <input ref={importRef} type="file" accept=".sqlite,.db" onChange={handleImport} style={{ display: 'none' }} />
          </div>

          <div style={{ borderTop: '1px solid var(--gray-border)', paddingTop: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 6px', color: '#b91c1c' }}>
              Zone de Nettoyage (حذف البيانات)
            </h4>
            <p style={{ fontSize: 12, color: 'var(--gray)', margin: '0 0 10px' }}>
              إذا أردت إفراغ جميع المنتجات والبدء بمتجر فارغ تماماً لإضافة منتجاتك الحقيقية:
            </p>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={handleClearAllProducts}
            >
              <Trash2 size={14} /> Supprimer TOUS les produits (حذف كافة المنتجات)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
