// components/AppPreloader.tsx
import React, { useState, useEffect } from 'react';
import './AppPreloader.css';

interface AppPreloaderProps {
  onLoadingComplete?: () => void;
  appVersion?: string;
}

const AppPreloader: React.FC<AppPreloaderProps> = ({ 
  onLoadingComplete, 
  appVersion = 'v1.0.0' 
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [loadingText, setLoadingText] = useState<string>('Sistem başlatılıyor...');
  const [isVisible, setIsVisible] = useState<boolean>(true);

  // Simüle edilen yükleme adımları
  const loadingSteps = [
    { percent: 15, text: 'Renk kartela sistemi hazırlanıyor...' },
    { percent: 30, text: 'Veritabanı bağlantısı kuruluyor...' },
    { percent: 45, text: 'Kullanıcı oturumu açılıyor...' },
    { percent: 60, text: 'Raf ve hücre verileri yükleniyor...' },
    { percent: 75, text: 'Kartela bilgileri getiriliyor...' },
    { percent: 90, text: 'Son kontroller yapılıyor...' },
    { percent: 100, text: 'Sistem hazır!' }
  ];

  useEffect(() => {
    let currentStep = 0;
    const totalSteps = loadingSteps.length;
    
    const interval = setInterval(() => {
      if (currentStep < totalSteps) {
        setProgress(loadingSteps[currentStep].percent);
        setLoadingText(loadingSteps[currentStep].text);
        currentStep++;
        
        // Son adıma gelindiğinde
        if (currentStep === totalSteps) {
          clearInterval(interval);
          
          // Kısa bir bekleme ve kapatma
          setTimeout(() => {
            setIsVisible(false);
            if (onLoadingComplete) {
              onLoadingComplete();
            }
          }, 800);
        }
      }
    }, 600); // Her adım arası 600ms

    return () => clearInterval(interval);
  }, [onLoadingComplete]);

  if (!isVisible) return null;

  return (
    <div className="app-preloader">
      <div className="preloader-container">
        {/* Logo ve Başlık */}
        <div className="preloader-header">
          <div className="color-palette-icon">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 64 64" 
              className="palette-svg"
            >
              <rect x="8" y="8" width="48" height="48" rx="8" fill="none" stroke="#1890ff" strokeWidth="3" />
              <circle cx="24" cy="24" r="6" fill="#ff4d4f" />
              <circle cx="40" cy="24" r="6" fill="#52c41a" />
              <circle cx="24" cy="40" r="6" fill="#faad14" />
              <circle cx="40" cy="40" r="6" fill="#722ed1" />
              <path d="M32 28v8M28 32h8" stroke="#1890ff" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="app-title">RENK KARTELA SİSTEMİ</h1>
          <p className="app-subtitle">Endüstriyel Renk Yönetimi</p>
        </div>

        {/* Progress Bar */}
        <div className="progress-section">
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="progress-info">
            <span className="progress-percent">{progress}%</span>
            <span className="progress-text">{loadingText}</span>
          </div>
        </div>

        {/* Yükleme Animasyonu */}
        <div className="loading-animation">
          <div className="loading-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        </div>

        {/* Versiyon ve Telif */}
        <div className="preloader-footer">
          <span className="version-info">{appVersion}</span>
          <span className="copyright">
            © {new Date().getFullYear()} - KT-{new Date().getFullYear()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AppPreloader;