class HuggingFaceSummarizer {
  constructor(token, model = "facebook/bart-large-cnn") {
    if (HuggingFaceSummarizer.instance) {
      return HuggingFaceSummarizer.instance
    }
    if (!token) {
      throw new Error("API token is required");
    }
    this.token = token;
    this.model = model;
    HuggingFaceSummarizer.instance = this
  }
  async summarize(text) {
    const payload = {
      "inputs": `summarize this and also give the key point : ${text}`,
      "parameters": { "temperature": 0.8, "max_new_tokens": 50, "seed": 42 },
    }


    const response = await fetch(`${HuggingFaceSummarizer.getUrl()}/${this.model}`, {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const data = response.json()
    return res.status(200)
      .json({
        status: 200,
        data
      })
  }

  static getUrl() {
    if (!process.env.HF_URL) {
      throw new Error("Hugging Face URL is missing in env.")
    }
    return process.env.HF_URL;
  }

  static getInstance(token, model) {
    return new HuggingFaceSummarizer(token, model)
  }
}
// HuggingFaceSummarizer.prototype.apiKey = null;
// HuggingFaceSummarizer.prototype.model = null;

export {
  HuggingFaceSummarizer
}