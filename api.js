import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
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
          
          console.log('Backend login response:', response.data);
          
          // Store the token securely
          localStorage.setItem("token", response.data.data.token);
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

  // Wait for MOS code with retries
  async waitForMosCode(appKey, maxRetries = 5, delay = 1000) {
    // Add initial delay to let SDK initialize
    await new Promise(res => setTimeout(res, 500));
    /*
    let code = null;
    while (!code) {
      try {
        console.log('Calling mos.login...');
        console.log({window}) 
        const mosResponse = await window.mos.login(appKey);
        console.log('MOS response:', mosResponse);
        code = ( mosResponse?.code ?? mosResponse?.data?.code ) || null;
      } catch (e) {
        console.error('MOS login failed:', e);
        break
      }
    }

    console.log({code});
    */
    
    /*
    try {
      return await this.retry(async () => {
        const {code } = await window.mos.login(appKey)
        if (!code) throw new Error('No code in response');
        console.log("=======try get code", code);
        return code;
      }, maxRetries, 10, 1);
    } catch (error) {
      throw error;
    }
      */
    // const sign = await window.mos.getSign()
    // console.log("===========sign", sign);
    
    // const code = await window.mos.login(appKey).then(data => data.code)
    // console.log("===========code", code);
        
    // return code;


    // Call mos.login only once
    try {
      console.log('Calling mos.login...');
      const mosResponse = await window.mos.login(appKey);
      console.log('MOS response:', mosResponse);
      
      const code = mosResponse?.code ?? mosResponse?.data?.code;
      if (code) {
        console.log('Success! Got code:', code);
        return code;
      } else {
        throw new Error('No code in response');
      }
    } catch (e) {
      console.error('MOS login failed:', e);
      throw e;
    }
  }

  // retry(callback, maxRetries = 5, delay = 1000, multiple =1) {
  //   return new Promise((resolve, reject) => {
  //     const retry = async () => {
  //       try {
  //         const result = await callback();
  //         resolve(result);
  //       } catch (e) {
  //         if (maxRetries > 0) {
  //           maxRetries--;
  //           await new Promise(resolve => setTimeout(resolve, delay * multiple));
  //           return retry();
  //         }
  //         reject(e);
  //       } 
  //     };
  //     retry();
  //   });
  // }

  // Check if user is logged in
  isLoggedIn() {
    return localStorage.getItem("token") !== null;
  }

  // Get stored token
  getToken() {
    return localStorage.getItem("token");
  }

  // Logout
  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userCode");
  }

  // Retrieve game data
  async getGameData() {
    try {
      const response = await apiClient.get('/progress/popStar/get');
      console.log('Game data:', response.data);
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
} 