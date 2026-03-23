import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type SectionId = 'hero' | 'about' | 'skills' | 'projects' | 'certificates' | 'contact' | 'cafeai';

interface NavigationState {
  activeSection: SectionId;
  isTransitioning: boolean;
  zoomTarget: string | null;
}

const initialState: NavigationState = {
  activeSection: 'hero',
  isTransitioning: false,
  zoomTarget: null,
};

const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    setActiveSection(state, action: PayloadAction<SectionId>) {
      state.activeSection = action.payload;
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

export const { setActiveSection, startTransition, endTransition } = navigationSlice.actions;
export default navigationSlice.reducer;