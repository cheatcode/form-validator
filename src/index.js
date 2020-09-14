const axios = require("axios");

class HypothesisAPI {
  constructor(apiKey, options = {}) {
    if (!apiKey) this._throwFormattedError("A valid API key is required.");
    this.apiKey = apiKey;
    this.customerId = options.customerId || null;
    this.debug = options.debug || false;

    this.customers = {
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
        if (error && error.response) {
          const { status } = error.response;
          const errorMessage =
            error.response &&
            error.response.data &&
            error.response.data &&
            error.response.data.data &&
            error.response.data.data.error;

          console.warn(`[${status}] ${errorMessage}`);

          if (error.response.data) {
            console.warn(error.response.data);
          }

          if (this.debug && error.response.data && error.response.data.data) {
            this._logDebugMessage(error.response.data.data.error);
            this._logDebugMessage(error.response.data.data.validationErrors);
          }
        }
      });
  }

  track(key, properties) {
    if (!key) throw new Error("Must pass a key to track.");

    const body = { key };

    if (this.customerId) body.customerId = this.customerId;

    if (
      !this.customerId &&
      body.customerId &&
      properties &&
      properties.customerId
    ) {
      body.customerId = properties.customerId;
      delete properties.customerId;
    }

    if (properties) body.properties = properties;

    return this._request("post", "/behavior", body);
  }

  _loginCustomer(customerId) {
    if (!customerId) throw new Error("Must pass a customerId.");

    this.customerId = customerId;

    return this._request("put", `/customers/login`, {
      customerId,
    });
  }

  _logoutCustomer(customerId) {
    if (!customerId && !this.customerId)
      throw new Error("Must have a customerId to logout.");

    return this._request(
      "put",
      `/customers/logout`,
      {
        customerId: customerId || this.customerId,
      },
      () => {
        this.customerId = null;
      }
    );
  }

  _createCustomer(customer) {
    if (!customer) throw new Error("Must pass a customer.");

    return this._request("post", "/customers", {
      ...customer,
    });
  }

  _updateCustomer(customerId, update) {
    if (!customerId) throw new Error("Must pass a customerId.");
    if (!update) throw new Error("Must pass an update for the customer.");

    return this._request("put", `/customers/${customerId}`, {
      ...update,
    });
  }

  _deleteCustomer(customerId) {
    if (!customerId) throw new Error("Must pass a customerId.");
    return this._request("delete", `/customers/${customerId}`);
  }

  _bulkCreateCustomers(options) {
    if (!options || (options && !options.customers))
      throw new Error("Must pass an array of customers.");
    return this._request("post", `/customers/bulk`);
  }
}

export default HypothesisAPI;
