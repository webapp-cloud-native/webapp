const AppHelper = require("../helpers/app-helper");
const TestDatabase = require("../config/test-database");

describe("Health Check API", () => {
  let appHelper;

  beforeAll(async () => {
    // Setup test database
    await TestDatabase.setup();

    // Create and start test app
    appHelper = new AppHelper();
    await appHelper.createTestApp();
    await appHelper.startServer();
  });

  afterAll(async () => {
    // Cleanup
    await appHelper.stopServer();
    await TestDatabase.cleanup();
  });

  beforeEach(async () => {
    // Clean test data before each test
    await TestDatabase.clearData();
  });

  describe("GET /healthz", () => {
    describe("Positive Test Cases", () => {
      test("should return 200 OK with empty body when database is available", async () => {
        const response = await appHelper
          .getRequest()
          .get("/healthz")
          .expect(200);

        // Verify headers
        expect(response.headers["cache-control"]).toBe(
          "no-cache, no-store, must-revalidate"
        );
        expect(response.headers["pragma"]).toBe("no-cache");
        expect(response.headers["x-content-type-options"]).toBe("nosniff");

        // Verify empty body
        expect(response.text).toBe("");
      });

      test("should insert record in health_checks table", async () => {
        // Get initial count
        const { sequelize } = require("../../src/config/database");
        const [initialResults] = await sequelize.query(
          "SELECT COUNT(*) as count FROM health_checks"
        );
        const initialCount = parseInt(initialResults[0].count);

        // Make health check request
        await appHelper.getRequest().get("/healthz").expect(200);

        // Verify record was inserted
        const [finalResults] = await sequelize.query(
          "SELECT COUNT(*) as count FROM health_checks"
        );
        const finalCount = parseInt(finalResults[0].count);

        expect(finalCount).toBe(initialCount + 1);
      });

      test("should handle multiple concurrent requests", async () => {
        const requests = Array(5)
          .fill()
          .map(() => appHelper.getRequest().get("/healthz"));

        const responses = await Promise.all(requests);

        responses.forEach((response) => {
          expect(response.status).toBe(200);
          expect(response.text).toBe("");
        });
      });
    });

    describe("Negative Test Cases", () => {
      test("should return 400 Bad Request when request contains payload", async () => {
        const response = await appHelper
          .getRequest()
          .get("/healthz")
          .send({ data: "test" })
          .expect(400);

        // Verify headers are still set
        expect(response.headers["cache-control"]).toBe(
          "no-cache, no-store, must-revalidate"
        );
        expect(response.headers["pragma"]).toBe("no-cache");
        expect(response.headers["x-content-type-options"]).toBe("nosniff");
      });

      test("should return 400 Bad Request when query parameters are present", async () => {
        await appHelper.getRequest().get("/healthz?param=value").expect(400);
      });

      test("should return 405 Method Not Allowed for POST request", async () => {
        const response = await appHelper
          .getRequest()
          .post("/healthz")
          .expect(405);

        expect(response.headers["allow"]).toBe("GET");
        expect(response.headers["cache-control"]).toBe(
          "no-cache, no-store, must-revalidate"
        );
      });

      test("should return 405 Method Not Allowed for PUT request", async () => {
        const response = await appHelper
          .getRequest()
          .put("/healthz")
          .expect(405);

        expect(response.headers["allow"]).toBe("GET");
      });

      test("should return 405 Method Not Allowed for DELETE request", async () => {
        const response = await appHelper
          .getRequest()
          .delete("/healthz")
          .expect(405);

        expect(response.headers["allow"]).toBe("GET");
      });

      test("should return 405 Method Not Allowed for PATCH request", async () => {
        const response = await appHelper
          .getRequest()
          .patch("/healthz")
          .expect(405);

        expect(response.headers["allow"]).toBe("GET");
      });
    });

    describe("Edge Case Tests", () => {
      test("should handle requests with different Accept headers", async () => {
        const response = await appHelper
          .getRequest()
          .get("/healthz")
          .set("Accept", "application/json")
          .expect(200);

        expect(response.text).toBe("");
      });

      test("should handle requests with custom User-Agent", async () => {
        const response = await appHelper
          .getRequest()
          .get("/healthz")
          .set("User-Agent", "Test-Agent/1.0")
          .expect(200);

        expect(response.text).toBe("");
      });

      test("should maintain performance under repeated requests", async () => {
        const startTime = Date.now();

        // Make 10 requests
        const requests = Array(10)
          .fill()
          .map(() => appHelper.getRequest().get("/healthz").expect(200));

        await Promise.all(requests);

        const duration = Date.now() - startTime;
        console.log(`10 requests completed in ${duration}ms`);

        // Basic performance check - should complete within reasonable time
        expect(duration).toBeLessThan(5000); // 5 seconds max for 10 requests
      });
    });
  });
});
describe("CI Workflow Verification Tests", () => {
  test("should return proper response time", async () => {
    const start = Date.now();
    const response = await appHelper.getRequest().get("/healthz").expect(200);
    const duration = Date.now() - start;

    // Should respond within 1 second
    expect(duration).toBeLessThan(1000);
  });

  test("should handle case-insensitive headers", async () => {
    const response = await appHelper
      .getRequest()
      .get("/healthz")
      .set("accept", "text/plain")
      .expect(200);

    expect(response.text).toBe("");
  });
});
