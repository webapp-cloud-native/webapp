const AppHelper = require("../../../helpers/app-helper");
const TestDatabase = require("../../../config/test-database");
const { User } = require("../../../../src/models/User");

describe("A. Positive Tests - Authentication Tests", () => {
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

  test("should authenticate successfully with valid credentials", async () => {
    const testUser = {
      username: `auth-${Date.now()}@example.com`,
      password: "AuthPass123!",
      first_name: "Auth",
      last_name: "User",
    };

    const createResponse = await appHelper
      .getRequest()
      .post("/v1/user")
      .send(testUser)
      .expect(201);
    const authHeader =
      "Basic " +
      Buffer.from(`${testUser.username}:${testUser.password}`).toString(
        "base64"
      );

    const response = await appHelper
      .getRequest()
      .get(`/v1/user/${createResponse.body.id}`)
      .set("Authorization", authHeader);

    // HTTP Status Code
    expect(response.status).toBe(200);

    // Response Body
    expect(response.body.id).toBe(createResponse.body.id);
  });

  test("should successfully register new user", async () => {
    const newUser = {
      username: `register-${Date.now()}@example.com`,
      password: "RegisterPass123!",
      first_name: "Register",
      last_name: "Test",
    };

    const response = await appHelper
      .getRequest()
      .post("/v1/user")
      .send(newUser);

    // HTTP Status Code
    expect(response.status).toBe(201);

    // Side Effects - User created in database
    const dbUser = await User.findByPk(response.body.id);
    expect(dbUser).toBeTruthy();
  });

  test("should access protected endpoint with valid token", async () => {
    const testUser = {
      username: `protected-${Date.now()}@example.com`,
      password: "ProtectedPass123!",
      first_name: "Protected",
      last_name: "Test",
    };

    const createResponse = await appHelper
      .getRequest()
      .post("/v1/user")
      .send(testUser)
      .expect(201);
    const authHeader =
      "Basic " +
      Buffer.from(`${testUser.username}:${testUser.password}`).toString(
        "base64"
      );

    // Test user endpoint
    const userResponse = await appHelper
      .getRequest()
      .get(`/v1/user/${createResponse.body.id}`)
      .set("Authorization", authHeader)
      .expect(200);
    expect(userResponse.body.id).toBe(createResponse.body.id);

    // Test product endpoint
    const productData = {
      name: "Auth Product",
      description: "Testing auth",
      sku: `AUTH-${Date.now()}`,
      manufacturer: "Auth Corp",
      quantity: 25,
    };

    const productResponse = await appHelper
      .getRequest()
      .post("/v1/product")
      .set("Authorization", authHeader)
      .send(productData);
    expect(productResponse.status).toBe(201);
  });
});
