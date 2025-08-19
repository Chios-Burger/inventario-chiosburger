import { useState, useEffect } from 'react';

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  devicePixelRatio: number;
  touchSupport: boolean;
}

/**
 * Hook para detectar información del dispositivo y determinar si es móvil
 * 
 * @returns DeviceInfo objeto con toda la información del dispositivo
 * 
 * @example
 * ```tsx
 * const deviceInfo = useIsMobile();
 * 
 * if (deviceInfo.isMobile) {
 *   return <ComponenteMobile />;
 * }
 * 
 * return <ComponenteDesktop />;
 * ```
 */
export const useIsMobile = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isIOS: false,
    isAndroid: false,
    screenWidth: 0,
    screenHeight: 0,
    orientation: 'portrait',
    devicePixelRatio: 1,
    touchSupport: false
  });

  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const ua = navigator.userAgent;
      const pixelRatio = window.devicePixelRatio || 1;

      // Detectar tipo de dispositivo
      const isIOS = /iPhone|iPad|iPod/.test(ua);
      const isAndroid = /Android/.test(ua);
      const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Breakpoints basados en análisis del README
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      
      // Orientación
      const orientation: 'portrait' | 'landscape' = width > height ? 'landscape' : 'portrait';

      setDeviceInfo({
        isMobile,
        isTablet,
        isIOS,
        isAndroid,
        screenWidth: width,
        screenHeight: height,
        orientation,
        devicePixelRatio: pixelRatio,
        touchSupport: hasTouchSupport
      });
    };

    // Detección inicial
    detectDevice();

    // Listeners para cambios
    const handleResize = () => detectDevice();
    const handleOrientationChange = () => {
      // Timeout para dar tiempo al navegador a ajustar las dimensiones
      setTimeout(detectDevice, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return deviceInfo;
};

/**
 * Hook simplificado que solo retorna si es móvil o no
 * 
 * @returns boolean true si es móvil
 * 
 * @example
 * ```tsx
 * const isMobile = useIsMobileSimple();
 * 
 * return (
 *   <div className={isMobile ? 'mobile-styles' : 'desktop-styles'}>
 *     Contenido
 *   </div>
 * );
 * ```
 */
export const useIsMobileSimple = (): boolean => {
  const { isMobile } = useIsMobile();
  return isMobile;
};