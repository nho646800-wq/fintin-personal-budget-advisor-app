type Listener = () => void;

let pending = false;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener());
}

function routeKeyFromHref(href: string): string | null {
  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

/** Call right before an in-app navigation begins. No-op for the current URL. */
export function startNavigationProgress(href: string) {
  const nextKey = routeKeyFromHref(href);
  const currentKey = `${window.location.pathname}${window.location.search}`;
  if (nextKey == null || nextKey === currentKey || pending) return;
  pending = true;
  notify();
}

export function stopNavigationProgress() {
  if (!pending) return;
  pending = false;
  notify();
}

export function subscribeNavigationProgress(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getNavigationProgress() {
  return pending;
}
