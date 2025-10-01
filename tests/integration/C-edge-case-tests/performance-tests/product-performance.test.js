const AppHelper = require("../../../helpers/app-helper");
const TestDatabase = require("../../../config/test-database");

describe("C. Edge Case Tests - Performance Tests - Product", () => {
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
      username: `prodperf-${Date.now()}@example.com`,
      password: "ProdPerf123!",
      first_name: "Prod",
      last_name: "Perf",
    };

    const userResponse = await appHelper
      .getRequest()
      .post("/v1/user")
      .send(testUser)
      .expect(201);
    authHeader =
      "Basic " +
      Buffer.from(`${testUser.username}:${testUser.password}`).toString(
        "base64"
      );
  });

  test("should have reasonable response time for product creation", async () => {
    const startTime = Date.now();

    await appHelper
      .getRequest()
      .post("/v1/product")
      .set("Authorization", authHeader)
      .send({
        name: "Perf Product",
        description: "Testing performance",
        sku: `PERF-${Date.now()}`,
        manufacturer: "Perf Corp",
        quantity: 50,
      })
      .expect(201);

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(1000);
  });

  test("should test with large dataset (10 products)", async () => {
    const startTime = Date.now();

    for (let i = 0; i < 10; i++) {
      await appHelper
        .getRequest()
        .post("/v1/product")
        .set("Authorization", authHeader)
        .send({
          name: `Bulk ${i}`,
          description: "Bulk test",
          sku: `BULK-${Date.now()}-${i}`,
          manufacturer: "Bulk Corp",
          quantity: i * 10,
        })
        .expect(201);
    }

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(5000);
    expect(await TestDatabase.getProductCount()).toBe(10);
  });
});
