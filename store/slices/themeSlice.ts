import { createSlice } from '@reduxjs/toolkit';

interface ThemeState {
  mode: 'dark';
}

const initialState: ThemeState = {
  mode: 'dark',
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {},
});

export default themeSlice.reducer;
