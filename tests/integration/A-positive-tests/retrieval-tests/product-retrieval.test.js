const AppHelper = require("../../../helpers/app-helper");
const TestDatabase = require("../../../config/test-database");

describe("A. Positive Tests - Retrieval Tests - Product Retrieval", () => {
  let appHelper;
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
      username: `prodowner-${Date.now()}@example.com`,
      password: "ProdOwner123!",
      first_name: "Product",
      last_name: "Owner",
    };

    const userResponse = await appHelper
      .getRequest()
      .post("/v1/user")
      .send(testUser)
      .expect(201);
    const authHeader =
      "Basic " +
      Buffer.from(`${testUser.username}:${testUser.password}`).toString(
        "base64"
      );

    const productData = {
      name: "Retrieve Test",
      description: "For retrieval",
      sku: `RETRIEVE-${Date.now()}`,
      manufacturer: "Retrieve Corp",
      quantity: 35,
    };

    const productResponse = await appHelper
      .getRequest()
      .post("/v1/product")
      .set("Authorization", authHeader)
      .send(productData)
      .expect(201);
    productId = productResponse.body.id;
  });

  test("should get product by valid ID", async () => {
    const response = await appHelper
      .getRequest()
      .get(`/v1/product/${productId}`);

    // HTTP Status Code
    expect(response.status).toBe(200);

    // Response Headers
    expect(response.headers["content-type"]).toMatch(/application\/json/);

    // Response Body - JSON Structure
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("name");
    expect(response.body).toHaveProperty("sku");

    // Response Body - Field Values
    expect(response.body.id).toBe(productId);

    // Response Body - Data Types
    expect(typeof response.body.id).toBe("number");
    expect(typeof response.body.quantity).toBe("number");
  });

  test("should get product without authentication (public endpoint)", async () => {
    const response = await appHelper
      .getRequest()
      .get(`/v1/product/${productId}`);
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(productId);
  });

  test("should verify response structure and data types", async () => {
    const response = await appHelper
      .getRequest()
      .get(`/v1/product/${productId}`)
      .expect(200);

    const requiredFields = [
      "id",
      "name",
      "description",
      "sku",
      "manufacturer",
      "quantity",
      "date_added",
      "date_last_updated",
      "owner_user_id",
    ];
    requiredFields.forEach((field) =>
      expect(response.body).toHaveProperty(field)
    );

    expect(typeof response.body.id).toBe("number");
    expect(Number.isInteger(response.body.quantity)).toBe(true);
  });
});
