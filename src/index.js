const axios = require("axios");

class HypothesisAPI {
  constructor(apiKey, options = {}) {
    if (!apiKey) this._throwFormattedError("A valid API key is required.");
    this.apiKey = apiKey;
    this.productCustomerId = options.productCustomerId || null;
    this.debug = options.debug || false;

    this.customers = {
      current: this._showCurrentCustomer.bind(this),
      login: this._loginCustomer.bind(this),
      logout: this._logoutCustomer.bind(this),
      create: this._createCustomer.bind(this),
      update: this._updateCustomer.bind(this),
      delete: this._deleteCustomer.bind(this),
      bulk: {
        create: this._bulkCreateCustomers.bind(this),
      },
    };
  }

  _logDebugMessage(message) {
    console.log("( Hypothesis.js )");
    console.log(message);
  }

  _throwFormattedError(error) {
    throw new Error(
      `[Hypothesis] ${error} See https://www.notion.so/Hypothesis-js-Reference-3618ad6c2d5d4447a762a8f63f627efa.`
    );
  }

  _request(method, path, data = {}) {
    if (this.debug) {
      this._logDebugMessage({
        method,
        url: `http://localhost:4000/api/v1${path}`,
        headers: {
          "x-api-key": this.apiKey,
        },
        data,
      });
    }

    // NOTE: http://localhost:4000/api is dynamically swapped to https://api.hypothesis.app in /release.js when releasing a new version. Leave as-is for local dev.
    return axios({
      method,
      url: `http://localhost:4000/api/v1${path}`,
      headers: {
        "x-api-key": this.apiKey,
      },
      data,
    })
      .then((response) => {
        return response && response.data && response.data.data;
      })
      .catch((error) => {
        console.warn(error.response);
        if (error && error.response) {
          const { status } = error.response;
          const errorMessage =
            error.response &&
            error.response.data &&
            error.response.data &&
            error.response.data.data &&
            error.response.data.data.error;

          console.warn(`[${status}] ${errorMessage}`);

          if (this.debug && error.response.data && error.response.data.data) {
            this._logDebugMessage(error.response.data.data.error);
            this._logDebugMessage(error.response.data.data.validationErrors);
            return error.response.data;
          }
        }
      });
  }

  track(key, properties) {
    if (!key) throw new Error("Must pass a key to track.");

    const body = { key };

    if (this.productCustomerId) body.productCustomerId = this.productCustomerId;

    if (!this.productCustomerId && properties && properties.productCustomerId) {
      body.productCustomerId = properties.productCustomerId;
      delete properties.productCustomerId;
    }

    if (properties) body.properties = properties;

    return this._request("post", "/behavior", body);
  }

  _showCurrentCustomer() {
    const response = {
      productCustomerId: this.productCustomerId,
    };

    console.log(response);

    return response;
  }

  _loginCustomer(productCustomerId) {
    if (!productCustomerId) throw new Error("Must pass a productCustomerId.");

    this.productCustomerId = productCustomerId;

    return this._request("put", `/customers/login`, {
      productCustomerId,
    });
  }

  _logoutCustomer(productCustomerId) {
    if (!productCustomerId && !this.productCustomerId)
      throw new Error("Must have a productCustomerId to logout.");

    return this._request(
      "put",
      `/customers/logout`,
      {
        productCustomerId: productCustomerId || this.productCustomerId,
      },
      () => {
        this.productCustomerId = null;
      }
    );
  }

  _createCustomer(customer) {
    if (!customer) throw new Error("Must pass a customer.");

    return this._request("post", "/customers", {
      ...customer,
    });
  }

  _updateCustomer(productCustomerId, update) {
    if (!productCustomerId) throw new Error("Must pass a productCustomerId.");
    if (!update) throw new Error("Must pass an update for the customer.");

    return this._request("put", `/customers/${productCustomerId}`, {
      ...update,
    });
  }

  _deleteCustomer(productCustomerId) {
    if (!productCustomerId) throw new Error("Must pass a productCustomerId.");
    return this._request("delete", `/customers/${productCustomerId}`);
  }

  _bulkCreateCustomers(options) {
    if (!options || (options && !options.productCustomers))
      throw new Error("Must pass an array of productCustomers.");
    return this._request("post", `/customers/bulk`, options);
  }
}

export default HypothesisAPI;
