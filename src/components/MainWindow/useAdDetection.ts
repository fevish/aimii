import { useEffect } from 'react';

export const useAdDetection = () => {
  useEffect(() => {
    const setupAdDetection = () => {
      const adView = document.querySelector('owadview');
      const adSection = document.querySelector('.ad-section');

      if (!adView || !adSection) {
        return null;
      }

      const handleAdStart = (event: Event) => {
        adSection.classList.add('ad-running');
      };

      const handleAdEnd = (event: Event) => {
        adSection.classList.remove('ad-running');
      };

      // Wait for WebView to be ready before adding event listeners
      const setupListeners = () => {
        // Listen for ad start/end events (inspired by ow-native patterns)
        adView.addEventListener('play', handleAdStart);
        adView.addEventListener('display_ad_loaded', handleAdStart);
        adView.addEventListener('player_loaded', handleAdStart);
        adView.addEventListener('complete', handleAdEnd);
      };

      // Check if WebView is already ready, otherwise wait for dom-ready
      try {
        setupListeners();
      } catch (error) {
        adView.addEventListener('dom-ready', setupListeners, { once: true });
      }

      // Return cleanup function
      return () => {
        adView.removeEventListener('play', handleAdStart);
        adView.removeEventListener('display_ad_loaded', handleAdStart);
        adView.removeEventListener('player_loaded', handleAdStart);
        adView.removeEventListener('complete', handleAdEnd);
        adView.removeEventListener('dom-ready', setupListeners);
      };
    };

    const cleanup = setupAdDetection();
    return cleanup || (() => { });
  }, []);
};
