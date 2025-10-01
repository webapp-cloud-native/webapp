const AppHelper = require("../../../helpers/app-helper");
const TestDatabase = require("../../../config/test-database");

describe("A. Positive Tests - Retrieval Tests - User Retrieval", () => {
  let appHelper;
  let userId;
  let authHeader;

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
      username: `retrieve-${Date.now()}@example.com`,
      password: "RetrievePass123!",
      first_name: "Retrieve",
      last_name: "Test",
    };

    const createResponse = await appHelper
      .getRequest()
      .post("/v1/user")
      .send(testUser)
      .expect(201);
    userId = createResponse.body.id;
    authHeader =
      "Basic " +
      Buffer.from(`${testUser.username}:${testUser.password}`).toString(
        "base64"
      );
  });

  test("should get user by valid ID", async () => {
    const response = await appHelper
      .getRequest()
      .get(`/v1/user/${userId}`)
      .set("Authorization", authHeader);

    // HTTP Status Code
    expect(response.status).toBe(200);

    // Response Headers
    expect(response.headers["content-type"]).toMatch(/application\/json/);

    // Response Body - JSON Structure
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("username");

    // Response Body - Field Values
    expect(response.body.id).toBe(userId);

    // Response Body - Data Types
    expect(typeof response.body.id).toBe("number");
  });

  test("should verify response contains all fields except password", async () => {
    const response = await appHelper
      .getRequest()
      .get(`/v1/user/${userId}`)
      .set("Authorization", authHeader)
      .expect(200);

    const expectedFields = [
      "id",
      "username",
      "first_name",
      "last_name",
      "account_created",
      "account_updated",
    ];
    expect(Object.keys(response.body).sort()).toEqual(expectedFields.sort());
    expect(response.body).not.toHaveProperty("password");
  });

  test("should validate all data types in response", async () => {
    const response = await appHelper
      .getRequest()
      .get(`/v1/user/${userId}`)
      .set("Authorization", authHeader)
      .expect(200);

    // Response Body - Data Types
    expect(typeof response.body.id).toBe("number");
    expect(typeof response.body.username).toBe("string");
    expect(typeof response.body.first_name).toBe("string");
    expect(typeof response.body.account_created).toBe("string");
  });
});
