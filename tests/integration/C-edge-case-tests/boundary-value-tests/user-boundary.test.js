const AppHelper = require("../../../helpers/app-helper");
const TestDatabase = require("../../../config/test-database");

describe("C. Edge Case Tests - Boundary Value Tests - User", () => {
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

  test("should handle minimum string length (1 character)", async () => {
    const response = await appHelper
      .getRequest()
      .post("/v1/user")
      .send({
        username: `min-${Date.now()}@example.com`,
        password: "MinTest123!",
        first_name: "A",
        last_name: "B",
      })
      .expect(201);

    expect(response.body.first_name).toBe("A");
    expect(response.body.last_name).toBe("B");
  });

  test("should handle maximum string length (100 characters)", async () => {
    const response = await appHelper
      .getRequest()
      .post("/v1/user")
      .send({
        username: `max-${Date.now()}@example.com`,
        password: "MaxTest123!",
        first_name: "a".repeat(100),
        last_name: "b".repeat(100),
      })
      .expect(201);

    expect(response.body.first_name.length).toBe(100);
    expect(response.body.last_name.length).toBe(100);
  });

  test("should handle special characters in input", async () => {
    const response = await appHelper
      .getRequest()
      .post("/v1/user")
      .send({
        username: `special-${Date.now()}@example.com`,
        password: "SpecialTest123!",
        first_name: "Mary-Jane O'Brien",
        last_name: "García-López",
      })
      .expect(201);

    expect(response.body.first_name).toBe("Mary-Jane O'Brien");
    expect(response.body.last_name).toBe("García-López");
  });
});
