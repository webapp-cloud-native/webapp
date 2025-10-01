const AppHelper = require("../../../helpers/app-helper");
const TestDatabase = require("../../../config/test-database");

describe("C. Edge Case Tests - Performance Tests - User", () => {
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

  test("should have reasonable response time", async () => {
    const startTime = Date.now();

    const response = await appHelper
      .getRequest()
      .post("/v1/user")
      .send({
        username: `perf-${Date.now()}@example.com`,
        password: "PerfTest123!",
        first_name: "Perf",
        last_name: "Test",
      })
      .expect(201);

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(1000);
    expect(response.body).toHaveProperty("id");
  });

  test("should handle concurrent requests", async () => {
    const users = Array(5)
      .fill()
      .map((_, i) => ({
        username: `concurrent${i}-${Date.now()}@example.com`,
        password: "ConcurrentPass123!",
        first_name: `User${i}`,
        last_name: "Test",
      }));

    const requests = users.map((user) =>
      appHelper.getRequest().post("/v1/user").send(user)
    );
    const responses = await Promise.all(requests);

    responses.forEach((response, index) => {
      expect(response.status).toBe(201);
      expect(response.body.username).toBe(users[index].username);
    });
  });
});
