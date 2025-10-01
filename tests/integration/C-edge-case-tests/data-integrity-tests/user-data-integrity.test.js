const AppHelper = require("../../../helpers/app-helper");
const TestDatabase = require("../../../config/test-database");
const { User } = require("../../../../src/models/User");

describe("C. Edge Case Tests - Data Integrity Tests - User", () => {
  let appHelper;
  let userId;
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
      username: `integrity-${Date.now()}@example.com`,
      password: "IntegrityTest123!",
      first_name: "Integrity",
      last_name: "Test",
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

  test("should verify created data persists correctly", async () => {
    const dbUser = await User.findByPk(userId);

    expect(dbUser).toBeTruthy();
    expect(dbUser.username).toMatch(/@example\.com$/);
    expect(dbUser.first_name).toBe("Integrity");
  });

  test("should verify updates don't affect unmodified fields", async () => {
    const initialResponse = await appHelper
      .getRequest()
      .get(`/v1/user/${userId}`)
      .set("Authorization", authHeader)
      .expect(200);

    await appHelper
      .getRequest()
      .put(`/v1/user/${userId}`)
      .set("Authorization", authHeader)
      .send({ first_name: "Updated" })
      .expect(204);

    const updatedResponse = await appHelper
      .getRequest()
      .get(`/v1/user/${userId}`)
      .set("Authorization", authHeader)
      .expect(200);

    expect(updatedResponse.body.first_name).toBe("Updated");
    expect(updatedResponse.body.last_name).toBe(initialResponse.body.last_name);
    expect(updatedResponse.body.username).toBe(initialResponse.body.username);
  });

  test("should verify password is hashed (BCrypt)", async () => {
    const dbUser = await User.findByPk(userId);

    expect(dbUser.password).toMatch(/^\$2[ab]\$\d{2}\$/);
    expect(dbUser.password.length).toBeGreaterThan(50);
  });
});
