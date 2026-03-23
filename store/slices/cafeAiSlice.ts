import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { canBrew, incrementUsage } from '@/utils/rateLimit';

// ── Types ──────────────────────────────────────────────────────────────────

export interface FlavorProfile {
  bitter: number;
  sweet:  number;
  acidic: number;
  creamy: number;
  bold:   number;
}

export interface Recipe {
  recipe_name:        string;
  tagline:            string;
  flavor_story:       string;
  beans:              string;
  brew_method:        string;
  ratio:              string;
  temperature:        string;
  steps:              string[];
  flavor_profile:     FlavorProfile;
  mood_match:         string;
  detected_emotions:  Record<string, number>;
}

export interface CafeAIState {
  text:    string;
  tags:    string[];
  recipe:  Recipe | null;
  status:  'idle' | 'loading' | 'success' | 'error';
  error:   string | null;
}

// ── Initial state ──────────────────────────────────────────────────────────

const initialState: CafeAIState = {
  text:   '',
  tags:   [],
  recipe: null,
  status: 'idle',
  error:  null,
};

// ── Async thunk — calls the FastAPI backend ────────────────────────────────

export const brewRecipe = createAsyncThunk<
  Recipe,
  { text: string; tags: string[] },
  { rejectValue: string }
>(
  'cafeai/brewRecipe',
  async ({ text, tags }, { rejectWithValue }) => {
    if (!canBrew()) {
      return rejectWithValue(
        'You have reached the weekly limit of 20 brews. Come back next week. ☕'
      );
    }
     try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/generate-recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, tags }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return rejectWithValue(data?.detail ?? `Server error ${res.status}`);
      }

      const recipe = await res.json() as Recipe;

      // ── Only increment AFTER successful response ───────────────
      incrementUsage();

      return recipe;
    } catch {
      return rejectWithValue('Backend not reachable. Make sure the server is running.');
    }
  }
);

// ── Slice ──────────────────────────────────────────────────────────────────

const cafeAISlice = createSlice({
  name: 'cafeai',
  initialState,
  reducers: {
    setText(state, action: PayloadAction<string>) {
      state.text = action.payload;
    },
    toggleTag(state, action: PayloadAction<string>) {
      const tag = action.payload;
      state.tags = state.tags.includes(tag)
        ? state.tags.filter(t => t !== tag)
        : [...state.tags, tag];
    },
    clearRecipe(state) {
      state.recipe = null;
      state.status = 'idle';
      state.error  = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(brewRecipe.pending, state => {
        state.status = 'loading';
        state.error  = null;
        state.recipe = null;
      })
      .addCase(brewRecipe.fulfilled, (state, action) => {
        state.status = 'success';
        state.recipe = action.payload;
      })
      .addCase(brewRecipe.rejected, (state, action) => {
        state.status = 'error';
        state.error  = action.payload ?? 'Something went wrong.';
      });
  },
});

export const { setText, toggleTag, clearRecipe } = cafeAISlice.actions;
export default cafeAISlice.reducer;