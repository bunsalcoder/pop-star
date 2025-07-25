import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Response interceptor to handle 401 errors and refresh tokens
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const gameAPI = new GameAPI();
        await gameAPI.refreshToken();

        const token = localStorage.getItem("popStarToken");
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("popStarToken");
        localStorage.removeItem("isMosLoggedIn");
        throw refreshError;
      }
    }
    
    return Promise.reject(error);
  }
);

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("popStarToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export class GameAPI {
  constructor() {
    this.isLoggingIn = false;
  }

  // Login with MOS and backend verification
  async authenticate() {
    const appKey = import.meta.env.VITE_APP_KEY;
    if (!appKey) {
      throw new Error('VITE_APP_KEY not found in environment variables');
    }

    if (
      typeof window !== "undefined" &&
      window.mos &&
      typeof window.mos.login === "function"
    ) {
      if (this.isLoggingIn) {
        throw new Error('Login already in progress');
      }
      this.isLoggingIn = true;
      try {
        const code = await this.waitForMosCode(appKey, 5, 1000);
        
        // Send the code to your backend for verification
        if (code) {
          const response = await axios.post("https://mp-test.mos.me/api/games/login/popStar/miniAppLogin", {
            code: code
          });
          
          // Store the token securely
          localStorage.setItem("popStarToken", response.data.data.token);
          localStorage.setItem("isMosLoggedIn", true);
          
          return response.data;
        }
      } catch (e) {
        console.error('Final MOS login failure:', e);
        throw e;
      } finally {
        this.isLoggingIn = false;
      }
    } else {
      throw new Error("MOS login is not available.");
    }
  }

  async refreshToken() {
    const appKey = import.meta.env.VITE_APP_KEY;
    if (!appKey) {
      throw new Error('VITE_APP_KEY not found in environment variables');
    }

    if (
      typeof window !== "undefined" &&
      window.mos &&
      typeof window.mos.login === "function"
    ) {
      try {
        const code = await this.waitForMosCode(appKey, 5, 1000);
        
        if (code) {
          const response = await axios.post("https://mp-test.mos.me/api/games/login/popStar/miniAppLogin", {
            code: code
          });
          
          // Store the new token
          localStorage.setItem("popStarToken", response.data.data.token);
          localStorage.setItem("isMosLoggedIn", true);
          
          return response.data;
        }
      } catch (e) {
        console.error('Token refresh failure:', e);
        throw e;
      }
    } else {
      throw new Error("MOS login is not available for token refresh.");
    }
  }

  // Wait for MOS code with retries
  async waitForMosCode(appKey, maxRetries = 5, delay = 1000) {
    // Add initial delay to let SDK initialize
    await new Promise(res => setTimeout(res, 500));
    
    // Call mos.login only once
    try {
      const mosResponse = await window.mos.login(appKey);
      
      const code = mosResponse?.code ?? mosResponse?.data?.code;
      if (code) {
        return code;
      } else {
        throw new Error('No code in response');
      }
    } catch (e) {
      console.error('MOS login failed:', e);
      throw e;
    }
  }

  // Check if user is logged in
  isLoggedIn() {
    return localStorage.getItem("popStarToken") !== null;
  }

  // Get stored token
  getToken() {
    return localStorage.getItem("popStarToken");
  }

  // Logout
  logout() {
    localStorage.removeItem("popStarToken");
    localStorage.removeItem("userCode");
  }

  // Retrieve game data
  async getGameData() {
    try {
      const response = await apiClient.get('/progress/popStar/get');
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  // Save game data
  async saveGameData(data) {
    try {
      const response = await apiClient.post('/progress/popStar/save', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Clear game data (game over)
  async clearGameData() {
    try {
      const response = await apiClient.post('/progress/popStar/clear');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
} 