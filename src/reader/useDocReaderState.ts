import { useEffect, useMemo, useState } from 'react';

export function useDocReaderState(sectionIds: string[], subIds: string[] = []) {
  const [activeSectionId, setActiveSectionId] = useState<string>(sectionIds[0] ?? '');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    function onScroll() {
      const total = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const pct = total > 0 ? Math.min(100, Math.max(0, (window.scrollY / total) * 100)) : 0;
      setScrollProgress(pct);
      setShowBackToTop(window.scrollY > 400);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!sectionIds.length && !subIds.length) return;
    const subSet = new Set(subIds);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (!visible.length) return;
        // Prefer sub-anchors over section wrappers when both are visible —
        // otherwise clicking a sub-heading lands you on the parent section's
        // active state because the section wrapper is always "above" the
        // sub in the viewport.
        const subsVisible = visible.filter((e) => subSet.has((e.target as HTMLElement).id));
        const pool = subsVisible.length ? subsVisible : visible;
        pool.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        setActiveSectionId(pool[0].target.id);
      },
      { rootMargin: '-80px 0px -65% 0px', threshold: 0 },
    );
    [...sectionIds, ...subIds].forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sectionIds.join('|'), subIds.join('|')]);

  // When the user clicks an in-page anchor (#sub-id), the URL hash changes
  // before the scroll settles. Snap the active state immediately so the
  // sidebar reflects intent without waiting for the IntersectionObserver
  // (which sometimes picks the parent section instead).
  useEffect(() => {
    function onHashChange() {
      const hash = decodeURIComponent(location.hash.replace(/^#/, ''));
      if (hash) setActiveSectionId(hash);
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const activeIndex = useMemo(() => Math.max(0, sectionIds.indexOf(activeSectionId)), [activeSectionId, sectionIds]);
  return { activeSectionId, setActiveSectionId, scrollProgress, showBackToTop, activeIndex };
}
