const Hypothesis = require("../dist/index.min");
const axios = require("axios");

jest.mock("axios");

describe("index.js", () => {
  beforeEach(() => {
    axios.mockReset();
    axios.mockImplementation(() => Promise.resolve());

    // NOTE: Mock global Date constructor so all dates match in test.
    global.Date = jest.fn(() => ({
      toISOString: jest.fn(() => "2019-12-15T00:00:00.000Z"),
    }));
  });

  test("it creates an instance with the api key", () => {
    const hypothesis = new Hypothesis("apiKey123");
    expect(hypothesis.apiKey).toBe("apiKey123");
  });

  test("it throws an error if api key is not passed", () => {
    expect(() => {
      const hypothesis = new Hypothesis();
    }).toThrow("A valid API key is required.");
  });

  test("it can track an event", () => {
    const hypothesis = new Hypothesis("apiKey123");
    hypothesis.track("an event");
    expect(axios).toHaveBeenCalledWith({
      method: "post",
      url: `https://api.hypothesis.app/v1/behavior`,
      headers: {
        "x-api-key": "apiKey123",
      },
      data: {
        key: "an event",
      },
    });
  });

  test("it throws an error if no key is passed to track", () => {
    expect(() => {
      const hypothesis = new Hypothesis("apiKey123");
      hypothesis.track();
    }).toThrow("Must pass a key to track.");
  });

  test("it can track a customer login", () => {
    const hypothesis = new Hypothesis("apiKey123");
    hypothesis.customers.login("1234");
    expect(axios).toHaveBeenCalledWith({
      method: "put",
      url: `https://api.hypothesis.app/v1/customers/login`,
      headers: {
        "x-api-key": "apiKey123",
      },
      data: {
        customerId: "1234",
      },
    });
  });

  test("it throws an error if no customerId is passed to customers.login", () => {
    expect(() => {
      const hypothesis = new Hypothesis("apiKey123");
      hypothesis.customers.login();
    }).toThrow("Must pass a customerId.");
  });

  test("it can track a customer logout", () => {
    const hypothesis = new Hypothesis("apiKey123");
    hypothesis.customers.login("1234"); // NOTE: Assigns the current customer internally.
    hypothesis.customers.logout();
    expect(axios).toHaveBeenCalledWith({
      method: "put",
      url: `https://api.hypothesis.app/v1/customers/logout`,
      headers: {
        "x-api-key": "apiKey123",
      },
      data: {
        customerId: "1234",
      },
    });
  });

  test("it throws an error if no customerId is set on the hypothesis instance on customers.logout", () => {
    expect(() => {
      const hypothesis = new Hypothesis("apiKey123");
      hypothesis.customers.logout();
    }).toThrow("Must have a customerId to logout.");
  });

  test("it can create a customer", () => {
    const hypothesis = new Hypothesis("apiKey123");
    hypothesis.customers.create({ emailAddress: "test@test.com" });
    expect(axios).toHaveBeenCalledWith({
      method: "post",
      url: `https://api.hypothesis.app/v1/customers`,
      headers: {
        "x-api-key": "apiKey123",
      },
      data: {
        emailAddress: "test@test.com",
      },
    });
  });

  test("it throws an error if no customer is passed to customers.create", () => {
    expect(() => {
      const hypothesis = new Hypothesis("apiKey123");
      hypothesis.customers.create();
    }).toThrow("Must pass a customer.");
  });

  test("it can update a customer", () => {
    const hypothesis = new Hypothesis("apiKey123");
    hypothesis.customers.update("customerId123", {
      emailAddress: "test1@test.com",
    });
    expect(axios).toHaveBeenCalledWith({
      method: "put",
      url: `https://api.hypothesis.app/v1/customers/customerId123`,
      headers: {
        "x-api-key": "apiKey123",
      },
      data: {
        emailAddress: "test1@test.com",
      },
    });
  });

  test("it throws an error if no customerId is passed to customers.update", () => {
    expect(() => {
      const hypothesis = new Hypothesis("apiKey123");
      hypothesis.customers.update();
    }).toThrow("Must pass a customerId.");
  });

  test("it throws an error if no update is passed to customers.update", () => {
    expect(() => {
      const hypothesis = new Hypothesis("apiKey123");
      hypothesis.customers.update("customerId123");
    }).toThrow("Must pass an update for the customer.");
  });

  test("it can delete a customer", () => {
    const hypothesis = new Hypothesis("apiKey123");
    hypothesis.customers.delete("customerId123");
    expect(axios).toHaveBeenCalledWith({
      method: "delete",
      url: `https://api.hypothesis.app/v1/customers/customerId123`,
      headers: {
        "x-api-key": "apiKey123",
      },
      data: {},
    });
  });

  test("it throws an error if no customerId is passed to customers.delete", () => {
    expect(() => {
      const hypothesis = new Hypothesis("apiKey123");
      hypothesis.customers.delete();
    }).toThrow("Must pass a customerId.");
  });
});
