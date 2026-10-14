const loadedFonts = new Set<string>();

/**
 * Dynamically loads a Google Font by creating a stylesheet link in <head>.
 */
export function loadGoogleFont(family: string, weights: string[] = ['400', '600', '700']): Promise<boolean> {
  if (typeof document === 'undefined') {
    return Promise.resolve(false);
  }

  const normalizedKey = family.toLowerCase().trim();
  if (loadedFonts.has(normalizedKey)) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    try {
      // Build Google Fonts v2 URL
      const encodedFamily = encodeURIComponent(family).replace(/%20/g, '+');
      const sortedWeights = Array.from(new Set(weights))
        .map((w) => parseInt(w, 10))
        .filter((w) => !isNaN(w))
        .sort((a, b) => a - b);

      const weightsParam = sortedWeights.length > 0 ? `:wght@${sortedWeights.join(';')}` : '';
      const href = `https://fonts.googleapis.com/css2?family=${encodedFamily}${weightsParam}&display=swap`;

      // Check if link already exists in DOM
      const existingLink = document.querySelector(`link[data-font-tastic="${normalizedKey}"]`);
      if (existingLink) {
        loadedFonts.add(normalizedKey);
        resolve(true);
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.setAttribute('data-font-tastic', normalizedKey);

      link.onload = () => {
        loadedFonts.add(normalizedKey);
        // If Font Loading API is supported, ensure it's ready
        if (typeof document.fonts !== 'undefined' && document.fonts.load) {
          document.fonts
            .load(`16px "${family}"`)
            .then(() => resolve(true))
            .catch(() => resolve(true));
        } else {
          resolve(true);
        }
      };

      link.onerror = () => {
        console.warn(`[font-tastic] Failed to load font: ${family}`);
        resolve(false);
      };

      document.head.appendChild(link);
    } catch (err) {
      console.error(`[font-tastic] Error loading font: ${family}`, err);
      resolve(false);
    }
  });
}

/**
 * Checks if a font has already been injected and loaded by font-tastic.
 */
export function isFontLoaded(family: string): boolean {
  return loadedFonts.has(family.toLowerCase().trim());
}

/**
 * Preloads a list of font families concurrently.
 */
export async function preloadFonts(families: string[]): Promise<void> {
  await Promise.all(families.map((f) => loadGoogleFont(f)));
}
