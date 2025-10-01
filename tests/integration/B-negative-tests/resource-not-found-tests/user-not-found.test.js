const AppHelper = require("../../../helpers/app-helper");
const TestDatabase = require("../../../config/test-database");

describe("B. Negative Tests - Resource Not Found Tests - User", () => {
  let appHelper;
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
      username: `notfound-${Date.now()}@example.com`,
      password: "NotFound123!",
      first_name: "NotFound",
      last_name: "Test",
    };

    await appHelper.getRequest().post("/v1/user").send(testUser).expect(201);
    authHeader =
      "Basic " +
      Buffer.from(`${testUser.username}:${testUser.password}`).toString(
        "base64"
      );
  });

  test("should return 403 for non-existent user ID", async () => {
    const response = await appHelper
      .getRequest()
      .get("/v1/user/99999")
      .set("Authorization", authHeader);

    // HTTP Status Code
    expect(response.status).toBe(403);

    // Response Body
    expect(response.body.error).toBe("Forbidden");
  });

  test("should return 403 for updating non-existent user", async () => {
    const response = await appHelper
      .getRequest()
      .put("/v1/user/99999")
      .set("Authorization", authHeader)
      .send({ first_name: "Test" });
    expect(response.status).toBe(403);
  });

  test("should return 400 for invalid user ID format", async () => {
    const response = await appHelper
      .getRequest()
      .get("/v1/user/invalid-id")
      .set("Authorization", authHeader);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid user ID format");
  });
});
