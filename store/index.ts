import { configureStore } from '@reduxjs/toolkit';
import navigationReducer from './slices/navigationSlice';
import cafeAIReducer from '@/store/slices/cafeAiSlice';
import themeReducer from '@/store/slices/themeSlice';

export const store = configureStore({
  reducer: {
    navigation: navigationReducer,
    cafeai: cafeAIReducer,
    theme: themeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
