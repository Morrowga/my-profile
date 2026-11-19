import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MENU, SectionId } from '@/lib/planets';

export type { SectionId };

interface NavigationState {
  activeSection: SectionId;
  /** Which menu item is focused on the home screen (kept when you come back) */
  menuIndex: number;
  isTransitioning: boolean;
  zoomTarget: string | null;
  /** The About page can show the person ('about') or their GitHub profile ('github'); the button beside Back switches it */
  aboutView: 'about' | 'github';
}

const initialState: NavigationState = {
  activeSection: 'hero',
  menuIndex: 0,
  isTransitioning: false,
  zoomTarget: null,
  aboutView: 'about',
};

const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    setActiveSection(state, action: PayloadAction<SectionId>) {
      state.activeSection = action.payload;
      state.aboutView = 'about';      // coming back to About always starts with About, not GitHub
      const i = MENU.findIndex(m => m.id === action.payload);
      if (i > 0) state.menuIndex = i; // Home keeps the last focused item
    },
    setAboutView(state, action: PayloadAction<'about' | 'github'>) {
      state.aboutView = action.payload;
    },
    setMenuIndex(state, action: PayloadAction<number>) {
      state.menuIndex = Math.max(0, Math.min(MENU.length - 1, action.payload));
    },
    startTransition(state, action: PayloadAction<string>) {
      state.isTransitioning = true;
      state.zoomTarget = action.payload;
    },
    endTransition(state) {
      state.isTransitioning = false;
      state.zoomTarget = null;
    },
  },
});

export const { setActiveSection, setAboutView, setMenuIndex, startTransition, endTransition } = navigationSlice.actions;
export default navigationSlice.reducer;
