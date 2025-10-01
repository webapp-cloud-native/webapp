const AppHelper = require("../../../helpers/app-helper");
const TestDatabase = require("../../../config/test-database");

describe("B. Negative Tests - Invalid Input Tests - Product", () => {
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
      username: `prodtest-${Date.now()}@example.com`,
      password: "ProdTest123!",
      first_name: "Product",
      last_name: "Tester",
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

  test("should reject product creation missing name", async () => {
    const response = await appHelper
      .getRequest()
      .post("/v1/product")
      .set("Authorization", authHeader)
      .send({
        description: "Test",
        sku: `SKU-${Date.now()}`,
        manufacturer: "Test Corp",
        quantity: 50,
      });

    // HTTP Status Code
    expect(response.status).toBe(400);

    // Response Body
    expect(response.body.error).toBe("Bad Request");
    expect(response.body.message).toBe("Validation failed");
  });

  test("should reject product creation missing required fields", async () => {
    const response = await appHelper
      .getRequest()
      .post("/v1/product")
      .set("Authorization", authHeader)
      .send({
        name: "Test Product",
      })
      .expect(400);
  });

  test("should reject duplicate SKU", async () => {
    const sku = `DUP-${Date.now()}`;

    await appHelper
      .getRequest()
      .post("/v1/product")
      .set("Authorization", authHeader)
      .send({
        name: "First",
        description: "First",
        sku: sku,
        manufacturer: "First Corp",
        quantity: 30,
      })
      .expect(201);

    const response = await appHelper
      .getRequest()
      .post("/v1/product")
      .set("Authorization", authHeader)
      .send({
        name: "Second",
        description: "Second",
        sku: sku,
        manufacturer: "Second Corp",
        quantity: 40,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Product with this SKU already exists");
  });

  test("should reject negative quantity", async () => {
    const response = await appHelper
      .getRequest()
      .post("/v1/product")
      .set("Authorization", authHeader)
      .send({
        name: "Invalid",
        description: "Invalid quantity",
        sku: `NEG-${Date.now()}`,
        manufacturer: "Test",
        quantity: -5,
      });

    expect(response.status).toBe(400);
  });

  test("should reject quantity above maximum", async () => {
    const response = await appHelper
      .getRequest()
      .post("/v1/product")
      .set("Authorization", authHeader)
      .send({
        name: "Invalid",
        description: "Too high",
        sku: `HIGH-${Date.now()}`,
        manufacturer: "Test",
        quantity: 101,
      })
      .expect(400);
  });

  test("should reject updates with invalid data types", async () => {
    const productData = {
      name: "Test Product",
      description: "Test",
      sku: `TEST-${Date.now()}`,
      manufacturer: "Test Corp",
      quantity: 50,
    };

    const createResponse = await appHelper
      .getRequest()
      .post("/v1/product")
      .set("Authorization", authHeader)
      .send(productData)
      .expect(201);

    const response = await appHelper
      .getRequest()
      .patch(`/v1/product/${createResponse.body.id}`)
      .set("Authorization", authHeader)
      .send({
        quantity: "invalid",
      })
      .expect(400);
  });
});
