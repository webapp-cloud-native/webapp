const AppHelper = require("../../../helpers/app-helper");
const TestDatabase = require("../../../config/test-database");
const { Product } = require("../../../../src/models/Product");

describe("C. Edge Case Tests - Data Integrity Tests - Product", () => {
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
      username: `prodintegrity-${Date.now()}@example.com`,
      password: "ProdIntegrity123!",
      first_name: "Product",
      last_name: "Integrity",
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

  test("should verify created product persists correctly", async () => {
    const productData = {
      name: "Persist Product",
      description: "Testing persistence",
      sku: `PERSIST-${Date.now()}`,
      manufacturer: "Persist Corp",
      quantity: 50,
    };

    const response = await appHelper
      .getRequest()
      .post("/v1/product")
      .set("Authorization", authHeader)
      .send(productData)
      .expect(201);

    const dbProduct = await Product.findByPk(response.body.id);
    expect(dbProduct).toBeTruthy();
    expect(dbProduct.name).toBe(productData.name);
  });

  test("should verify updates don't affect unmodified fields", async () => {
    const createResponse = await appHelper
      .getRequest()
      .post("/v1/product")
      .set("Authorization", authHeader)
      .send({
        name: "Original",
        description: "Original desc",
        sku: `ORIG-${Date.now()}`,
        manufacturer: "Original Corp",
        quantity: 50,
      })
      .expect(201);

    const updateResponse = await appHelper
      .getRequest()
      .patch(`/v1/product/${createResponse.body.id}`)
      .set("Authorization", authHeader)
      .send({ quantity: 25 })
      .expect(200);

    expect(updateResponse.body.quantity).toBe(25);
    expect(updateResponse.body.name).toBe("Original");
  });

  test("should verify deleted data is properly removed", async () => {
    const createResponse = await appHelper
      .getRequest()
      .post("/v1/product")
      .set("Authorization", authHeader)
      .send({
        name: "Delete Test",
        description: "Will be deleted",
        sku: `DEL-${Date.now()}`,
        manufacturer: "Delete Corp",
        quantity: 30,
      })
      .expect(201);

    const productId = createResponse.body.id;

    await appHelper
      .getRequest()
      .delete(`/v1/product/${productId}`)
      .set("Authorization", authHeader)
      .expect(204);

    const dbProduct = await Product.findByPk(productId);
    expect(dbProduct).toBeNull();
  });
});
