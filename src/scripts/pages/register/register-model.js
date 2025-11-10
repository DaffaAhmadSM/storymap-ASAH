class RegisterModel {
  constructor() {
    this.apiUrl = null;
  }

  async register(baseUrl, name, email, password) {
    try {
      const endpoint = baseUrl + "/register";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`
        );
      }

      if (data.error) {
        throw new Error(data.message || "Registration failed");
      }

      return data;
    } catch (error) {
      console.error("Error during registration:", error);
      throw error;
    }
  }
}

export default RegisterModel;
