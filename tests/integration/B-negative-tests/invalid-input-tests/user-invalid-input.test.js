const AppHelper = require("../../../helpers/app-helper");
const TestDatabase = require("../../../config/test-database");

describe("B. Negative Tests - Invalid Input Tests - User", () => {
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
      username: `test-${Date.now()}@example.com`,
      password: "TestPass123!",
      first_name: "Test",
      last_name: "User",
    };

    const createResponse = await appHelper
      .getRequest()
      .post("/v1/user")
      .send(testUser)
      .expect(201);
    userId = createResponse.body.id;
    authHeader =
      "Basic " +
      Buffer.from(`${testUser.username}:${testUser.password}`).toString(
        "base64"
      );
  });

  test("should reject user creation missing username", async () => {
    const response = await appHelper.getRequest().post("/v1/user").send({
      password: "TestPass123!",
      first_name: "Test",
      last_name: "User",
    });

    // HTTP Status Code
    expect(response.status).toBe(400);

    // Response Body
    expect(response.body.error).toBe("Bad Request");
    expect(response.body.message).toBe("Validation failed");
  });

  test("should reject user creation missing password", async () => {
    const response = await appHelper
      .getRequest()
      .post("/v1/user")
      .send({
        username: `missing-${Date.now()}@example.com`,
        first_name: "Test",
        last_name: "User",
      })
      .expect(400);
  });

  test("should reject user creation missing first_name", async () => {
    const response = await appHelper
      .getRequest()
      .post("/v1/user")
      .send({
        username: `missing-${Date.now()}@example.com`,
        password: "TestPass123!",
        last_name: "User",
      })
      .expect(400);
  });

  test("should reject user creation missing last_name", async () => {
    const response = await appHelper
      .getRequest()
      .post("/v1/user")
      .send({
        username: `missing-${Date.now()}@example.com`,
        password: "TestPass123!",
        first_name: "Test",
      })
      .expect(400);
  });

  test("should reject invalid email format", async () => {
    const response = await appHelper.getRequest().post("/v1/user").send({
      username: "invalid-email",
      password: "TestPass123!",
      first_name: "Test",
      last_name: "User",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
  });

  test("should reject duplicate username", async () => {
    const testUser = {
      username: `duplicate-${Date.now()}@example.com`,
      password: "DupPass123!",
      first_name: "Dup",
      last_name: "User",
    };

    await appHelper.getRequest().post("/v1/user").send(testUser).expect(201);

    const response = await appHelper
      .getRequest()
      .post("/v1/user")
      .send(testUser);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "User with this username already exists"
    );
  });

  test("should reject weak password (too short)", async () => {
    const response = await appHelper
      .getRequest()
      .post("/v1/user")
      .send({
        username: `weak-${Date.now()}@example.com`,
        password: "Short1!",
        first_name: "Test",
        last_name: "User",
      })
      .expect(400);
  });

  test("should reject update with invalid data types", async () => {
    const response = await appHelper
      .getRequest()
      .put(`/v1/user/${userId}`)
      .set("Authorization", authHeader)
      .send({
        username: "newemail@example.com",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/cannot be updated/);
  });
});
