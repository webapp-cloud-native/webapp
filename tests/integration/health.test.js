const AppHelper = require("../helpers/app-helper");
const TestDatabase = require("../config/test-database");

describe("Health Check API - Minimal Suite", () => {
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
    await TestDatabase.clearData();
  });

  test("should return 200 OK when database is available", async () => {
    const response = await appHelper.getRequest().get("/healthz");

    // HTTP Status Code
    expect(response.status).toBe(200);

    // Response Headers
    expect(response.headers["cache-control"]).toBe(
      "no-cache, no-store, must-revalidate"
    );

    // Response Body
    expect(response.text).toBe("");

    // Side Effects - Database insert
    const { sequelize } = require("../../src/config/database");
    const [results] = await sequelize.query(
      "SELECT COUNT(*) as count FROM health_checks"
    );
    expect(parseInt(results[0].count)).toBeGreaterThan(0);
  });

  test("should return 400 when request contains payload", async () => {
    const response = await appHelper
      .getRequest()
      .get("/healthz")
      .send({ data: "test" });

    // HTTP Status Code
    expect(response.status).toBe(400);

    // Response Headers
    expect(response.headers["cache-control"]).toMatch(/no-cache/);
  });

  test("should return 405 for POST request", async () => {
    const response = await appHelper.getRequest().post("/healthz");

    // HTTP Status Code
    expect(response.status).toBe(405);

    // Response Headers
    expect(response.headers["allow"]).toBe("GET");
  });

  test("should return 405 for PUT request", async () => {
    const response = await appHelper.getRequest().put("/healthz");
    expect(response.status).toBe(405);
  });

  test("should return 405 for DELETE request", async () => {
    const response = await appHelper.getRequest().delete("/healthz");
    expect(response.status).toBe(405);
  });
});
