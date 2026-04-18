// Route path → view file paths mapping.
// Paths in .view must be relative from the server root so the router's
// fetch() and dynamic import() both resolve correctly.

export const routes = [
  {
    path:  '/',
    title: 'Dashboard',
    view: {
      html: './src/views/home/view.html',
      css:  './src/views/home/view.css',
      js:   './src/views/home/view.js',
    },
  },
  {
    path:  '/page-one',
    title: 'Shipments',
    view: {
      html: './src/views/page-one/view.html',
      css:  './src/views/page-one/view.css',
      js:   './src/views/page-one/view.js',
    },
  },
  {
    path:  '/preview-page',
    title: 'Settings',
    view: {
      html: './src/views/preview-page/view.html',
      css:  './src/views/preview-page/view.css',
      js:   './src/views/preview-page/view.js',
    },
  },
];

export const notFoundRoute = {
  path:  '/not-found',
  title: 'Page Not Found',
  view: {
    html: './src/views/not-found/view.html',
    css:  './src/views/not-found/view.css',
    js:   './src/views/not-found/view.js',
  },
};

/**
 * Normalise a pathname so trailing slashes and /index.html are treated as /.
 * @param {string} pathname
 * @returns {string}
 */
export function normalizePath(pathname) {
  if (!pathname || pathname === '/index.html') return '/';
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}