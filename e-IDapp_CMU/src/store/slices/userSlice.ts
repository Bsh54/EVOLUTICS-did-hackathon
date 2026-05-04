import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { saveUserData, loadUserData, savePin, StoredUserData } from '../../utils/localStorage';

export interface UserState {
  name: string;
  pin: string;
  id: string;
  email: string;
  polyIdUrl: string;
  isSetupComplete: boolean;
  profileImage?: string;
  qrCodeData?: string;
  passphrase?: string;
  language?: string;
  firstName?: string;
  lastName?: string;
  photo?: string;
  uniqueIdentifier?: string;
}

const initialState: UserState = {
  name: '',
  pin: '',
  id: '',
  email: '',
  polyIdUrl: '',
  isSetupComplete: false,
  profileImage: undefined,
  qrCodeData: undefined,
  passphrase: undefined,
  language: 'en',
  firstName: undefined,
  lastName: undefined,
  photo: undefined,
  uniqueIdentifier: undefined,
};

// Async thunk to load user data from storage
export const loadUserDataFromStorage: any = createAsyncThunk(
  'user/loadUserDataFromStorage',
  async () => {
    const userData = await loadUserData();
    return userData;
  }
);

// Async thunk to save user data to storage
export const saveUserDataToStorage = createAsyncThunk(
  'user/saveUserDataToStorage',
  async (_, { getState }) => {
    const state = getState() as { user: UserState };
    await saveUserData(state.user as StoredUserData);
    return true;
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserName: (state, action: PayloadAction<string>) => {
      state.name = action.payload;
    },
    setUserPin: (state, action: PayloadAction<string>) => {
      state.pin = action.payload;
      // Save PIN separately for verification
      savePin(action.payload).catch(error => console.error('Error saving PIN:', error));
    },
    setUserId: (state, action: PayloadAction<string>) => {
      state.id = action.payload;
    },
    setUserEmail: (state, action: PayloadAction<string>) => {
      state.email = action.payload;
    },
    setPolyIdUrl: (state, action: PayloadAction<string>) => {
      state.polyIdUrl = action.payload;
    },
    setSetupComplete: (state, action: PayloadAction<boolean>) => {
      state.isSetupComplete = action.payload;
    },
    setProfileImage: (state, action: PayloadAction<string>) => {
      state.profileImage = action.payload;
    },
    setQrCodeData: (state, action: PayloadAction<string>) => {
      state.qrCodeData = action.payload;
    },
    setPassphrase: (state, action: PayloadAction<string>) => {
      state.passphrase = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    setUserApiData: (state, action: PayloadAction<{
      firstName: string;
      lastName: string;
      photo: string;
      uniqueIdentifier: string;
    }>) => {
      state.firstName = action.payload.firstName;
      state.lastName = action.payload.lastName;
      state.photo = action.payload.photo;
      state.uniqueIdentifier = action.payload.uniqueIdentifier;

      // Automatically populate other required fields if they are missing
      if (!state.id) {
        state.id = action.payload.uniqueIdentifier;
      }

      if (!state.name) {
        state.name = `${action.payload.firstName} ${action.payload.lastName}`.trim();
      }

      if (!state.email) {
        state.email = `${state.name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
      }

      if (!state.polyIdUrl) {
        state.polyIdUrl = `https://polyid.network/user/${state.name.toLowerCase().replace(/\s+/g, '.')}`;
      }
    },
    resetUser: (_state) => {
      return initialState;
    },
    completeUserSetup: (state) => {
      // Generate dummy data when setup is completed
      if (!state.id) {
        state.id = `PID-${new Date().getFullYear()}-${Math.floor(Math.random() * 999999).toString().padStart(6, '0')}`;
      }

      // Generate names if they are not set (from manual entry or EnterNameScreen)
      if (!state.firstName || !state.lastName) {
        const nameParts = state.name.trim().split(/\s+/);
        if (nameParts.length > 0) {
          state.firstName = state.firstName || nameParts[0];
          state.lastName = state.lastName || nameParts.slice(1).join(' ');
        }
      }

      if (!state.email) {
        state.email = `${state.name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
      }
      if (!state.polyIdUrl) {
        state.polyIdUrl = `https://polyid.network/user/${state.name.toLowerCase().replace(/\s+/g, '.')}`;
      }

      // Generate QR code data if missing (since we skip FaceScanScreen)
      if (!state.qrCodeData) {
        state.qrCodeData = JSON.stringify({
          name: state.name,
          firstName: state.firstName,
          lastName: state.lastName,
          id: state.id,
          uniqueIdentifier: state.uniqueIdentifier || state.id,
          // No faceImage as it's skipped
        });
      }

      state.isSetupComplete = true;

      // Save user data to local storage
      saveUserData({
        name: state.name,
        pin: state.pin,
        id: state.id,
        email: state.email,
        polyIdUrl: state.polyIdUrl,
        isSetupComplete: true,
        profileImage: state.profileImage,
        qrCodeData: state.qrCodeData,
        passphrase: state.passphrase,
        language: state.language
      }).catch(error => console.error('Error saving user data:', error));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUserDataFromStorage.fulfilled, (state, action) => {
        if (action.payload) {
          return {
            ...state,
            ...action.payload
          };
        }
      })
      .addCase(loadUserDataFromStorage.rejected, (state, action) => {
        console.error('Failed to load user data:', action.error);
      })
      .addCase(saveUserDataToStorage.rejected, (state, action) => {
        console.error('Failed to save user data:', action.error);
      });
  },
});

export const {
  setUserName,
  setUserPin,
  setUserId,
  setUserEmail,
  setPolyIdUrl,
  setSetupComplete,
  setProfileImage,
  setQrCodeData,
  setPassphrase,
  setLanguage,
  resetUser,
  completeUserSetup,
  setUserApiData,
} = userSlice.actions;

export default userSlice.reducer;