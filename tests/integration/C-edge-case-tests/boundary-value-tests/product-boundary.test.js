const AppHelper = require("../../../helpers/app-helper");
const TestDatabase = require("../../../config/test-database");

describe("C. Edge Case Tests - Boundary Value Tests - Product", () => {
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
      username: `boundary-${Date.now()}@example.com`,
      password: "BoundaryPass123!",
      first_name: "Boundary",
      last_name: "Test",
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

  test("should handle minimum numeric value (quantity 0)", async () => {
    const response = await appHelper
      .getRequest()
      .post("/v1/product")
      .set("Authorization", authHeader)
      .send({
        name: "Min Quantity",
        description: "Testing min",
        sku: `MIN-${Date.now()}`,
        manufacturer: "Min Corp",
        quantity: 0,
      })
      .expect(201);

    expect(response.body.quantity).toBe(0);
  });

  test("should handle maximum numeric value (quantity 100)", async () => {
    const response = await appHelper
      .getRequest()
      .post("/v1/product")
      .set("Authorization", authHeader)
      .send({
        name: "Max Quantity",
        description: "Testing max",
        sku: `MAX-${Date.now()}`,
        manufacturer: "Max Corp",
        quantity: 100,
      })
      .expect(201);

    expect(response.body.quantity).toBe(100);
  });

  test("should handle special characters in input", async () => {
    const response = await appHelper
      .getRequest()
      .post("/v1/product")
      .set("Authorization", authHeader)
      .send({
        name: "Special Product - Test!",
        description: "Special chars: @#$%^&*()",
        sku: `SPECIAL-${Date.now()}`,
        manufacturer: "Special & Co.",
        quantity: 50,
      })
      .expect(201);

    expect(response.body.name).toBe("Special Product - Test!");
    expect(response.body.manufacturer).toBe("Special & Co.");
  });
});
