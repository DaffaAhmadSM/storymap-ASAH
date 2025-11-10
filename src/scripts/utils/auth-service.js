/**
 * AuthService - Handles authentication operations
 * Manages login, logout, and token storage
 */
class AuthService {
  constructor() {
    this.apiBaseUrl = "https://story-api.dicoding.dev";
    this.tokenKey = "auth_token";
    this.userKey = "user_data";
  }

  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User data and token
   */
  async login(email, password) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v1/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.message || "Login failed");
      }

      // Store token and user data
      const token = data.loginResult.token;
      const userData = {
        userId: data.loginResult.userId,
        name: data.loginResult.name,
        token: token,
      };

      this.saveToken(token);
      this.saveUserData(userData);

      return userData;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  logout() {
    this.removeToken();
    this.removeUserData();
  }

  /**
   * Save token to localStorage
   * @param {string} token - Authentication token
   */
  saveToken(token) {
    localStorage.setItem(this.tokenKey, token);
  }

  /**
   * Get token from localStorage
   * @returns {string|null} Token or null
   */
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Remove token from localStorage
   */
  removeToken() {
    localStorage.removeItem(this.tokenKey);
  }

  /**
   * Save user data to localStorage
   * @param {Object} userData - User data object
   */
  saveUserData(userData) {
    localStorage.setItem(this.userKey, JSON.stringify(userData));
  }

  /**
   * Get user data from localStorage
   * @returns {Object|null} User data or null
   */
  getUserData() {
    const data = localStorage.getItem(this.userKey);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Remove user data from localStorage
   */
  removeUserData() {
    localStorage.removeItem(this.userKey);
  }

  /**
   * Check if user is logged in
   * @returns {boolean} True if logged in
   */
  isLoggedIn() {
    return this.getToken() !== null;
  }

  /**
   * Get current user with avatar
   * @returns {Object|null} User object with avatar or null
   */
  getCurrentUser() {
    const userData = this.getUserData();
    if (!userData) return null;

    // Add default avatar if not present
    return {
      ...userData,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=3498db&color=fff&size=128`,
    };
  }
}

export default AuthService;
