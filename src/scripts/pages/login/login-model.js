/**
 * LoginModel - Model for Login Page
 * Handles authentication data operations
 */
class LoginModel {
  constructor() {
    this.apiBaseUrl = "https://story-api.dicoding.dev";
    this.currentUser = null;
  }

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

      // Store current user data
      this.currentUser = {
        userId: data.loginResult.userId,
        name: data.loginResult.name,
        token: data.loginResult.token,
      };

      return this.currentUser;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Clears current user data
   */
  clearUser() {
    this.currentUser = null;
  }
}

export default LoginModel;
