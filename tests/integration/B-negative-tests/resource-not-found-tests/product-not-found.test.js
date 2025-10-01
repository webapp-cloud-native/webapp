const AppHelper = require("../../../helpers/app-helper");
const TestDatabase = require("../../../config/test-database");

describe("B. Negative Tests - Resource Not Found Tests - Product", () => {
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
      username: `prodnotfound-${Date.now()}@example.com`,
      password: "ProdNotFound123!",
      first_name: "Product",
      last_name: "NotFound",
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

  test("should return 404 for non-existent product on GET", async () => {
    const response = await appHelper.getRequest().get("/v1/product/99999");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Not Found");
    expect(response.body.message).toBe("Product not found");
  });

  test("should return 404 for non-existent product on UPDATE", async () => {
    const response = await appHelper
      .getRequest()
      .put("/v1/product/99999")
      .set("Authorization", authHeader)
      .send({
        name: "Test",
        description: "Test",
        sku: `TEST-${Date.now()}`,
        manufacturer: "Test",
        quantity: 50,
      });

    expect(response.status).toBe(404);
  });

  test("should return 404 for non-existent product on DELETE", async () => {
    const response = await appHelper
      .getRequest()
      .delete("/v1/product/99999")
      .set("Authorization", authHeader);
    expect(response.status).toBe(404);
  });

  test("should return 400 for invalid product ID format", async () => {
    const response = await appHelper.getRequest().get("/v1/product/invalid-id");
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid product ID format");
  });
});
