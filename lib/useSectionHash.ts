'use client';
import { useEffect, useRef } from 'react';
import { MENU } from '@/lib/planets';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setAboutView, setActiveSection, type SectionId } from '@/store/slices/navigationSlice';

/**
 * Keeps the open page in the address (#about, #lab, #about/github), so a reload or a shared link opens the same page instead of Home.
 * The first render always matches the server (Home); right after it, the address is read once and the page is restored.
 * Only after that does the address follow the state (replaceState: no extra history entries, Home leaves a clean address).
 */
export function useSectionHash() {
  const dispatch = useAppDispatch();
  const { activeSection, aboutView } = useAppSelector(s => s.navigation);
  const ready = useRef(false);   // false until the address has been read once

  useEffect(() => {
    const [id, view] = window.location.hash.slice(1).split('/');
    if (MENU.some(m => m.id === id) && id !== 'hero') {
      dispatch(setActiveSection(id as SectionId));
      if (id === 'about' && view === 'github') dispatch(setAboutView('github'));
    }
  }, [dispatch]);

  useEffect(() => {
    // the first pass still holds Home (the restore above has not rendered yet): writing now would erase the address that is being restored
    if (!ready.current) { ready.current = true; return; }
    const hash = activeSection === 'hero' ? '' : `#${activeSection}${activeSection === 'about' && aboutView === 'github' ? '/github' : ''}`;
    if (window.location.hash !== hash) history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`);
  }, [activeSection, aboutView]);
}
