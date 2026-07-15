import { useEffect, useRef, useState } from 'react';

/** Fades+slides an element in once it has scrolled into (or past) view —
 * pairs with the `.reveal`/`.reveal-in` classes in globals.css.
 *
 * Uses a scroll/resize listener rather than bare IntersectionObserver:
 * anchor-link jumps (`href="#section"`, used throughout the nav) move the
 * scroll position instantly, and instant jumps can skip a threshold
 * crossing entirely — IntersectionObserver then never fires for elements
 * the jump skipped over, leaving them permanently invisible. Reading
 * getBoundingClientRect() on every scroll event catches that case too. */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let ticking = false;
    const check = () => {
      ticking = false;
      // top < innerHeight covers both "currently visible" and "already
      // scrolled past" (top goes negative) — either way it should show.
      if (el.getBoundingClientRect().top < window.innerHeight) {
        setVisible(true);
      }
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(check);
    };

    check();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return { ref, visible };
}
