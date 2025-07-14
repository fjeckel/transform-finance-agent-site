import { useEffect } from 'react';

declare global {
  interface Window {
    google?: {
      translate: {
        TranslateElement: {
          InlineLayout: { SIMPLE: string };
          new (options: { pageLanguage: string; includedLanguages: string; layout: string }, elementId: string): void;
        };
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

const GoogleTranslate = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);

    window.googleTranslateElementInit = () => {
      const translate = window.google?.translate;
      if (translate && translate.TranslateElement) {
        new translate.TranslateElement({
          pageLanguage: 'de',
          includedLanguages: 'en',
          layout: translate.TranslateElement.InlineLayout.SIMPLE,
        }, 'google_translate_element');
      }
    };

    return () => {
      document.body.removeChild(script);
      delete window.googleTranslateElementInit;
    };
  }, []);

  return <div id="google_translate_element" className="mt-4" />;
};

export default GoogleTranslate;
