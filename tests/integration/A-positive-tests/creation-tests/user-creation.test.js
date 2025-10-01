const AppHelper = require("../../../helpers/app-helper");
const TestDatabase = require("../../../config/test-database");
const { User } = require("../../../../src/models/User");

describe("A. Positive Tests - Creation Tests - User Creation", () => {
  let appHelper;

  beforeAll(async () => {
    await TestDatabase.setup();
    appHelper = new AppHelper();
    await appHelper.createTestApp();
    await appHelper.startServer();
  });

  afterAll(async () => {
    await appHelper.stopServer();
    await TestDatabase.cleanup();
  });

  beforeEach(async () => {
    await TestDatabase.safeClearData();
  });

  test("should create user with valid data", async () => {
    const userData = {
      username: `john-${Date.now()}@example.com`,
      password: "SecurePass123!",
      first_name: "John",
      last_name: "Doe",
    };

    const response = await appHelper
      .getRequest()
      .post("/v1/user")
      .send(userData);

    // HTTP Status Code
    expect(response.status).toBe(201);

    // Response Headers
    expect(response.headers["content-type"]).toMatch(/application\/json/);

    // Response Body - JSON Structure
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("username");
    expect(response.body).toHaveProperty("first_name");
    expect(response.body).toHaveProperty("last_name");
    expect(response.body).toHaveProperty("account_created");
    expect(response.body).toHaveProperty("account_updated");

    // Response Body - Field Values
    expect(response.body.username).toBe(userData.username);
    expect(response.body.first_name).toBe(userData.first_name);

    // Response Body - Data Types
    expect(typeof response.body.id).toBe("number");
    expect(typeof response.body.username).toBe("string");

    // Side Effects - Data Persistence
    const dbUser = await User.findByPk(response.body.id);
    expect(dbUser).toBeTruthy();
    expect(dbUser.username).toBe(userData.username);
  });

  test("should verify response status code (201)", async () => {
    const userData = {
      username: `status-${Date.now()}@example.com`,
      password: "StatusTest123!",
      first_name: "Status",
      last_name: "Code",
    };

    const response = await appHelper
      .getRequest()
      .post("/v1/user")
      .send(userData);
    expect(response.status).toBe(201);
    expect(response.statusCode).toBe(201);
  });

  test("should validate response body structure and data", async () => {
    const userData = {
      username: `structure-${Date.now()}@example.com`,
      password: "StructurePass123!",
      first_name: "Structure",
      last_name: "Validation",
    };

    const response = await appHelper
      .getRequest()
      .post("/v1/user")
      .send(userData)
      .expect(201);

    // Response Body - JSON Structure
    const requiredFields = [
      "id",
      "username",
      "first_name",
      "last_name",
      "account_created",
      "account_updated",
    ];
    requiredFields.forEach((field) =>
      expect(response.body).toHaveProperty(field)
    );

    // Response Body - Data validation
    expect(response.body.account_created).toBe(response.body.account_updated);
  });

  test("should test user creation with different valid email formats", async () => {
    const validEmails = ["user+tag@domain.com", "user.name@domain.co.uk"];

    for (const email of validEmails) {
      const userData = {
        username: email,
        password: "TestPass123!",
        first_name: "Test",
        last_name: "User",
      };

      const response = await appHelper
        .getRequest()
        .post("/v1/user")
        .send(userData);
      expect(response.status).toBe(201);
      expect(response.body.username).toBe(email);
    }
  });

  test("should test user creation with different valid input combinations", async () => {
    const combinations = [
      { first_name: "A", last_name: "B" },
      { first_name: "José", last_name: "García" },
    ];

    for (let i = 0; i < combinations.length; i++) {
      const userData = {
        username: `combo${i}-${Date.now()}@example.com`,
        password: "ComboTest123!",
        ...combinations[i],
      };

      const response = await appHelper
        .getRequest()
        .post("/v1/user")
        .send(userData);
      expect(response.status).toBe(201);
      expect(response.body.first_name).toBe(combinations[i].first_name);
    }
  });
});
