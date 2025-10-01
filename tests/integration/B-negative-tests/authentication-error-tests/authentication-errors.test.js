const AppHelper = require("../../../helpers/app-helper");
const TestDatabase = require("../../../config/test-database");

describe("B. Negative Tests - Authentication Error Tests", () => {
  let appHelper;
  let userId;

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

    const testUser = {
      username: `autherr-${Date.now()}@example.com`,
      password: "AuthErr123!",
      first_name: "Auth",
      last_name: "Error",
    };

    const createResponse = await appHelper
      .getRequest()
      .post("/v1/user")
      .send(testUser)
      .expect(201);
    userId = createResponse.body.id;
  });

  test("should reject invalid credentials", async () => {
    const invalidAuthHeader =
      "Basic " +
      Buffer.from("invalid@example.com:WrongPass123!").toString("base64");

    const response = await appHelper
      .getRequest()
      .get(`/v1/user/${userId}`)
      .set("Authorization", invalidAuthHeader);

    // HTTP Status Code
    expect(response.status).toBe(401);

    // Response Headers
    expect(response.headers["content-type"]).toMatch(/application\/json/);

    // Response Body
    expect(response.body.error).toBe("Unauthorized");
  });

  test("should reject accessing protected endpoint without token", async () => {
    const response = await appHelper.getRequest().get(`/v1/user/${userId}`);

    // HTTP Status Code
    expect(response.status).toBe(401);

    // Response Body
    expect(response.body.error).toBe("Unauthorized");
    expect(response.body.message).toBe(
      "Authentication required. Please provide valid credentials."
    );
  });

  test("should reject malformed auth header", async () => {
    const response = await appHelper
      .getRequest()
      .get(`/v1/user/${userId}`)
      .set("Authorization", "Basic invalidbase64")
      .expect(401);
    expect(response.body.error).toBe("Unauthorized");
  });
});
