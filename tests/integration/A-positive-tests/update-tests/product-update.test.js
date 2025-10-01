const AppHelper = require("../../../helpers/app-helper");
const TestDatabase = require("../../../config/test-database");
const { Product } = require("../../../../src/models/Product");

describe("A. Positive Tests - Update Tests - Product Update", () => {
  let appHelper;
  let testUser;
  let authHeader;
  let userId;
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

    testUser = {
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

    userId = userResponse.body.id;
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

  test("should update product with PUT (full update)", async () => {
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
    expect(response.body.description).toBe(updateData.description);
    expect(response.body.sku).toBe(updateData.sku);
    expect(response.body.manufacturer).toBe(updateData.manufacturer);
    expect(response.body.quantity).toBe(updateData.quantity);

    // Response Body - Data Types
    expect(typeof response.body.id).toBe("number");
    expect(typeof response.body.name).toBe("string");
    expect(typeof response.body.quantity).toBe("number");

    // Side Effects - date_last_updated changed
    expect(response.body.date_last_updated).not.toBe(response.body.date_added);
  });

  test("should update product with PATCH (partial update)", async () => {
    const updateData = {
      quantity: 25,
      description: "Partially updated description",
    };

    const response = await appHelper
      .getRequest()
      .patch(`/v1/product/${productId}`)
      .set("Authorization", authHeader)
      .send(updateData);

    // HTTP Status Code
    expect(response.status).toBe(200);

    // Response Headers
    expect(response.headers["content-type"]).toMatch(/application\/json/);

    // Response Body - Field Values
    expect(response.body.quantity).toBe(25);
    expect(response.body.description).toBe("Partially updated description");

    // Side Effects - Unmodified fields unchanged
    expect(response.body.name).toBe("Original Product");
    expect(response.body.manufacturer).toBe("Original Corp");
  });

  test("should verify partial updates work correctly", async () => {
    const updateData = {
      quantity: 10,
    };

    const response = await appHelper
      .getRequest()
      .patch(`/v1/product/${productId}`)
      .set("Authorization", authHeader)
      .send(updateData)
      .expect(200);

    // Response Body - Field Values
    expect(response.body.quantity).toBe(10);

    // Side Effects - Other fields unchanged
    expect(response.body.name).toBe("Original Product");
    expect(response.body.description).toBe("Original description");
    expect(response.body.manufacturer).toBe("Original Corp");
  });

  test("should update product name independently", async () => {
    const response = await appHelper
      .getRequest()
      .patch(`/v1/product/${productId}`)
      .set("Authorization", authHeader)
      .send({ name: "Independent Name Update" })
      .expect(200);

    // Response Body - Field Values
    expect(response.body.name).toBe("Independent Name Update");
  });

  test("should update product description independently", async () => {
    const response = await appHelper
      .getRequest()
      .patch(`/v1/product/${productId}`)
      .set("Authorization", authHeader)
      .send({ description: "Independent description update" })
      .expect(200);

    expect(response.body.description).toBe("Independent description update");
  });

  test("should update product SKU independently", async () => {
    const newSku = `NEWSKU-${Date.now()}`;

    const response = await appHelper
      .getRequest()
      .patch(`/v1/product/${productId}`)
      .set("Authorization", authHeader)
      .send({ sku: newSku })
      .expect(200);

    expect(response.body.sku).toBe(newSku);
  });

  test("should update product manufacturer independently", async () => {
    const response = await appHelper
      .getRequest()
      .patch(`/v1/product/${productId}`)
      .set("Authorization", authHeader)
      .send({ manufacturer: "New Manufacturer Inc" })
      .expect(200);

    expect(response.body.manufacturer).toBe("New Manufacturer Inc");
  });

  test("should update product quantity independently", async () => {
    const response = await appHelper
      .getRequest()
      .patch(`/v1/product/${productId}`)
      .set("Authorization", authHeader)
      .send({ quantity: 99 })
      .expect(200);

    expect(response.body.quantity).toBe(99);
  });

  test("should verify date_last_updated changes on update", async () => {
    const initialResponse = await appHelper
      .getRequest()
      .get(`/v1/product/${productId}`)
      .expect(200);

    const initialTimestamp = new Date(initialResponse.body.date_last_updated);

    await new Promise((resolve) => setTimeout(resolve, 100));

    const updateResponse = await appHelper
      .getRequest()
      .patch(`/v1/product/${productId}`)
      .set("Authorization", authHeader)
      .send({ quantity: 60 })
      .expect(200);

    // Side Effects - Timestamp updated
    const updatedTimestamp = new Date(updateResponse.body.date_last_updated);
    expect(updatedTimestamp.getTime()).toBeGreaterThan(
      initialTimestamp.getTime()
    );

    // Side Effects - date_added unchanged
    expect(updateResponse.body.date_added).toBe(
      initialResponse.body.date_added
    );
  });

  test("should verify updates persist in database", async () => {
    const updateData = {
      name: "Persisted Update",
      quantity: 85,
    };

    await appHelper
      .getRequest()
      .patch(`/v1/product/${productId}`)
      .set("Authorization", authHeader)
      .send(updateData)
      .expect(200);

    // Side Effects - Data Persistence
    const dbProduct = await Product.findByPk(productId);
    expect(dbProduct.name).toBe("Persisted Update");
    expect(dbProduct.quantity).toBe(85);
  });
});
