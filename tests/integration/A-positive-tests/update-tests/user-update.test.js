const AppHelper = require("../../../helpers/app-helper");
const TestDatabase = require("../../../config/test-database");
const { Product } = require("../../../../src/models/Product");

describe("A. Positive Tests - Update Tests - Product Update", () => {
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
      username: `produpdate-${Date.now()}@example.com`,
      password: "ProdUpdate123!",
      first_name: "Product",
      last_name: "Updater",
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
      name: "Original Product",
      description: "Original description",
      sku: `ORIG-${Date.now()}`,
      manufacturer: "Original Corp",
      quantity: 50,
    };

    const productResponse = await appHelper
      .getRequest()
      .post("/v1/product")
      .set("Authorization", authHeader)
      .send(productData)
      .expect(201);
    productId = productResponse.body.id;
  });

  test("should update product with PUT successfully", async () => {
    const updateData = {
      name: "Updated Product",
      description: "Updated description",
      sku: `UPDATED-${Date.now()}`,
      manufacturer: "Updated Corp",
      quantity: 75,
    };

    const response = await appHelper
      .getRequest()
      .put(`/v1/product/${productId}`)
      .set("Authorization", authHeader)
      .send(updateData);

    // HTTP Status Code
    expect(response.status).toBe(200);

    // Response Headers
    expect(response.headers["content-type"]).toMatch(/application\/json/);

    // Response Body - Field Values
    expect(response.body.name).toBe(updateData.name);
    expect(response.body.quantity).toBe(updateData.quantity);

    // Side Effects - date_last_updated changed
    expect(response.body.date_last_updated).not.toBe(response.body.date_added);
  });

  test("should update product with PATCH (partial update)", async () => {
    const response = await appHelper
      .getRequest()
      .patch(`/v1/product/${productId}`)
      .set("Authorization", authHeader)
      .send({ quantity: 25 });

    expect(response.status).toBe(200);
    expect(response.body.quantity).toBe(25);

    // Side Effects - Unmodified fields unchanged
    expect(response.body.name).toBe("Original Product");
  });

  test("should verify partial updates work correctly", async () => {
    const response = await appHelper
      .getRequest()
      .patch(`/v1/product/${productId}`)
      .set("Authorization", authHeader)
      .send({ description: "New description" })
      .expect(200);

    expect(response.body.description).toBe("New description");
    expect(response.body.name).toBe("Original Product");
  });

  test("should test updating different fields independently", async () => {
    await appHelper
      .getRequest()
      .patch(`/v1/product/${productId}`)
      .set("Authorization", authHeader)
      .send({ name: "Name1" })
      .expect(200);
    await appHelper
      .getRequest()
      .patch(`/v1/product/${productId}`)
      .set("Authorization", authHeader)
      .send({ quantity: 30 })
      .expect(200);

    const verifyResponse = await appHelper
      .getRequest()
      .get(`/v1/product/${productId}`)
      .expect(200);
    expect(verifyResponse.body.name).toBe("Name1");
    expect(verifyResponse.body.quantity).toBe(30);
  });
});
