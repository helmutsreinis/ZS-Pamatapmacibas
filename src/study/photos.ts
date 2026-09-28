/** A processed photo of a study module: its URL and pixel size (from assets/images.json). */
export type Photo = { src: string; width: number; height: number };

/**
 * Look up a module's photos by file name. `urls` comes from the module's
 * `import.meta.glob('./assets/*', …)`, `sizes` from the images.json that tools/build_study_images.py writes.
 */
export function photoLibrary(urls: Record<string, string>, sizes: Record<string, { width: number; height: number }>) {
  return (file: string): Photo => {
    const src = urls[`./assets/${file}`];
    const size = sizes[file];
    if (!src || !size) throw new Error(`Trūkst attēla ${file}: palaid tools/build_study_images.py`);
    return { src, width: size.width, height: size.height };
  };
}
