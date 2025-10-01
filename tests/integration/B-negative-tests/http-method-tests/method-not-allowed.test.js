const AppHelper = require("../../../helpers/app-helper");
const TestDatabase = require("../../../config/test-database");

describe("B. Negative Tests - HTTP Method Tests", () => {
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

  test("should reject POST on /healthz", async () => {
    const response = await appHelper.getRequest().post("/healthz");

    // HTTP Status Code
    expect(response.status).toBe(405);

    // Response Headers
    expect(response.headers["allow"]).toBe("GET");
  });

  test("should reject GET on /v1/user", async () => {
    const response = await appHelper.getRequest().get("/v1/user");

    expect(response.status).toBe(405);
    expect(response.headers["allow"]).toBe("POST");
    expect(response.body.error).toBe("Method Not Allowed");
  });

  test("should reject POST on /v1/user/:userId", async () => {
    const response = await appHelper.getRequest().post("/v1/user/1");

    expect(response.status).toBe(405);
    expect(response.headers["allow"]).toBe("GET, PUT");
  });

  test("should return 404 for unsupported endpoint", async () => {
    const response = await appHelper.getRequest().get("/v1/unsupported");

    // HTTP Status Code
    expect(response.status).toBe(404);

    // Response Body
    expect(response.body.error).toBe("Not Found");
  });
});
