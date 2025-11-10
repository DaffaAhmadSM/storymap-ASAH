class AddStoryModel {
  constructor() {
    this.bearerToken = null;
  }

  setBearerToken(token) {
    this.bearerToken = token;
  }

  async addStory(baseUrl, formData, token) {
    try {
      const endpoint = baseUrl + "/stories";

      const fetchOptions = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      };

      const response = await fetch(endpoint, fetchOptions);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.message || "Failed to add story");
      }

      return data;
    } catch (error) {
      console.error("Error adding story:", error);
      throw error;
    }
  }
}

export default AddStoryModel;
