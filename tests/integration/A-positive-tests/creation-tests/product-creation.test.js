const AppHelper = require("../../../helpers/app-helper");
const TestDatabase = require("../../../config/test-database");
const { Product } = require("../../../../src/models/Product");

describe("A. Positive Tests - Creation Tests - Product Creation", () => {
  let appHelper;
  let authHeader;
  let userId;

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
      username: `owner-${Date.now()}@example.com`,
      password: "OwnerPass123!",
      first_name: "Product",
      last_name: "Owner",
    };

    const userResponse = await appHelper
      .getRequest()
      .post("/v1/user")
      .send(testUser)
      .expect(201);
    userId = userResponse.body.id;
    authHeader =
      "Basic " +
      Buffer.from(`${testUser.username}:${testUser.password}`).toString(
        "base64"
      );
  });

  test("should create product with valid data", async () => {
    const productData = {
      name: "Test Widget",
      description: "A high-quality test widget",
      sku: `WIDGET-${Date.now()}`,
      manufacturer: "Widget Corp",
      quantity: 50,
    };

    const response = await appHelper
      .getRequest()
      .post("/v1/product")
      .set("Authorization", authHeader)
      .send(productData);

    // HTTP Status Code
    expect(response.status).toBe(201);

    // Response Headers
    expect(response.headers["content-type"]).toMatch(/application\/json/);

    // Response Body - JSON Structure
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("name");
    expect(response.body).toHaveProperty("sku");
    expect(response.body).toHaveProperty("quantity");
    expect(response.body).toHaveProperty("owner_user_id");

    // Response Body - Field Values
    expect(response.body.name).toBe(productData.name);
    expect(response.body.owner_user_id).toBe(userId);

    // Response Body - Data Types
    expect(typeof response.body.id).toBe("number");
    expect(typeof response.body.quantity).toBe("number");

    // Side Effects - Data Persistence
    const dbProduct = await Product.findByPk(response.body.id);
    expect(dbProduct).toBeTruthy();
  });

  test("should verify response status code (201)", async () => {
    const productData = {
      name: "Status Test",
      description: "Testing 201",
      sku: `STATUS-${Date.now()}`,
      manufacturer: "Status Corp",
      quantity: 25,
    };

    const response = await appHelper
      .getRequest()
      .post("/v1/product")
      .set("Authorization", authHeader)
      .send(productData);
    expect(response.status).toBe(201);
  });

  test("should validate response body structure and data", async () => {
    const productData = {
      name: "Structure Test",
      description: "Testing structure",
      sku: `STRUCT-${Date.now()}`,
      manufacturer: "Structure Inc",
      quantity: 10,
    };

    const response = await appHelper
      .getRequest()
      .post("/v1/product")
      .set("Authorization", authHeader)
      .send(productData)
      .expect(201);

    // Response Body - Field Values
    expect(response.body.date_added).toBe(response.body.date_last_updated);
    expect(Object.keys(response.body).length).toBe(9);
  });

  test("should test product creation with different valid quantities", async () => {
    const quantities = [0, 50, 100];

    for (let i = 0; i < quantities.length; i++) {
      const productData = {
        name: `Qty Test ${i}`,
        description: "Testing quantity",
        sku: `QTY-${Date.now()}-${i}`,
        manufacturer: "Qty Corp",
        quantity: quantities[i],
      };

      const response = await appHelper
        .getRequest()
        .post("/v1/product")
        .set("Authorization", authHeader)
        .send(productData);
      expect(response.status).toBe(201);
      expect(response.body.quantity).toBe(quantities[i]);
    }
  });
});
