const AppHelper = require("../../../helpers/app-helper");
const TestDatabase = require("../../../config/test-database");
const { Product } = require("../../../../src/models/Product");

describe("A. Positive Tests - Delete Tests - Product Delete", () => {
  let appHelper;
  let authHeader;
  let productId;

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
      username: `deleter-${Date.now()}@example.com`,
      password: "DeleterPass123!",
      first_name: "Product",
      last_name: "Deleter",
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

    const productData = {
      name: "Product To Delete",
      description: "Will be deleted",
      sku: `DELETE-${Date.now()}`,
      manufacturer: "Delete Corp",
      quantity: 30,
    };

    const productResponse = await appHelper
      .getRequest()
      .post("/v1/product")
      .set("Authorization", authHeader)
      .send(productData)
      .expect(201);
    productId = productResponse.body.id;
  });

  test("should delete own product successfully", async () => {
    const response = await appHelper
      .getRequest()
      .delete(`/v1/product/${productId}`)
      .set("Authorization", authHeader);

    // HTTP Status Code
    expect(response.status).toBe(204);

    // Response Body - Empty
    expect(response.body).toEqual({});

    // Side Effects - Product removed from database
    const dbProduct = await Product.findByPk(productId);
    expect(dbProduct).toBeNull();
  });

  test("should verify deleted data is properly removed", async () => {
    await appHelper
      .getRequest()
      .delete(`/v1/product/${productId}`)
      .set("Authorization", authHeader)
      .expect(204);

    // Side Effects - GET returns 404
    await appHelper.getRequest().get(`/v1/product/${productId}`).expect(404);

    // Side Effects - Database count decreased
    const count = await TestDatabase.getProductCount();
    expect(count).toBe(0);
  });
});
