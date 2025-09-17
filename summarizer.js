class HuggingFaceSummarizer {
  constructor(token, model = "facebook/bart-large-cnn") {
    this.token = token;
    this.model = model;
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
    })
  }

  static getUrl() {
    return process.env.HF_URL;
  }

}
// HuggingFaceSummarizer.prototype.apiKey = null;
// HuggingFaceSummarizer.prototype.model = null;

export {
  HuggingFaceSummarizer
}