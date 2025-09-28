const AppHelper = require("../helpers/app-helper");
const TestDatabase = require("../config/test-database");
const { User } = require("../../src/models/User");

describe("User Authentication & Profile API", () => {
  let appHelper;
  let testUser;
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
    // Clean up any existing test data using safe method
    await TestDatabase.safeClearData();
    
    // Create a test user for authentication tests
    testUser = {
      email: "auth@example.com",
      password: "AuthPass123!",
      first_name: "Auth",
      last_name: "User"
    };

    // Create the user in database
    const createResponse = await appHelper
      .getRequest()
      .post("/v1/user")
      .send(testUser)
      .expect(201);
    
    userId = createResponse.body.id;
    
    // Generate auth header for authenticated requests
    authHeader = "Basic " + Buffer.from(`${testUser.email}:${testUser.password}`).toString('base64');
  });

  describe("GET /v1/user/self - Get User Information", () => {
    describe("Positive Test Cases", () => {
      test("should return user information with valid authentication", async () => {
        const response = await appHelper
          .getRequest()
          .get("/v1/user/self")
          .set("Authorization", authHeader)
          .expect(200);

        expect(response.body).toHaveProperty('id', userId);
        expect(response.body.email).toBe(testUser.email);
        expect(response.body.first_name).toBe(testUser.first_name);
        expect(response.body.last_name).toBe(testUser.last_name);
        expect(response.body).toHaveProperty('account_created');
        expect(response.body).toHaveProperty('account_updated');
        
        // Ensure password is not returned
        expect(response.body).not.toHaveProperty('password');
      });

      test("should return correct timestamps", async () => {
        const response = await appHelper
          .getRequest()
          .get("/v1/user/self")
          .set("Authorization", authHeader)
          .expect(200);

        const accountCreated = new Date(response.body.account_created);
        const accountUpdated = new Date(response.body.account_updated);
        
        expect(accountCreated).toBeInstanceOf(Date);
        expect(accountUpdated).toBeInstanceOf(Date);
        expect(accountCreated.getTime()).toBeLessThanOrEqual(new Date().getTime());
        expect(accountUpdated.getTime()).toBeLessThanOrEqual(new Date().getTime());
      });

      test("should return consistent data on multiple calls", async () => {
        const response1 = await appHelper
          .getRequest()
          .get("/v1/user/self")
          .set("Authorization", authHeader)
          .expect(200);

        // Wait a small amount to ensure any potential timing issues
        await new Promise(resolve => setTimeout(resolve, 10));

        const response2 = await appHelper
          .getRequest()
          .get("/v1/user/self")
          .set("Authorization", authHeader)
          .expect(200);

        expect(response1.body).toEqual(response2.body);
      });
    });

    describe("Negative Test Cases", () => {
      test("should return 401 for missing authentication", async () => {
        const response = await appHelper
          .getRequest()
          .get("/v1/user/self")
          .expect(401);

        expect(response.body.error).toBe("Unauthorized");
        expect(response.body.message).toBe("Authentication required. Please provide valid credentials.");
      });

      test("should return 401 for invalid credentials", async () => {
        const invalidAuthHeader = "Basic " + Buffer.from("invalid@example.com:wrongpassword").toString('base64');
        
        const response = await appHelper
          .getRequest()
          .get("/v1/user/self")
          .set("Authorization", invalidAuthHeader)
          .expect(401);

        expect(response.body.error).toBe("Unauthorized");
        expect(response.body.message).toBe("Invalid credentials provided.");
      });

      test("should return 401 for malformed auth header", async () => {
        const malformedHeaders = [
          "Basic invalidbase64",
          "Bearer token123",
          "Basic ", // Missing credentials
          "Invalid Header Format"
        ];

        for (const header of malformedHeaders) {
          const response = await appHelper
            .getRequest()
            .get("/v1/user/self")
            .set("Authorization", header)
            .expect(401);

          expect(response.body.error).toBe("Unauthorized");
        }
      });

      test("should return 401 for non-existent user", async () => {
        const nonExistentAuthHeader = "Basic " + Buffer.from("nonexistent@example.com:password123!").toString('base64');
        
        const response = await appHelper
          .getRequest()
          .get("/v1/user/self")
          .set("Authorization", nonExistentAuthHeader)
          .expect(401);

        expect(response.body.error).toBe("Unauthorized");
      });
    });

    describe("Method Not Allowed Tests", () => {
      test("should return 405 for unsupported methods on /v1/user/self", async () => {
        const unsupportedMethods = ['POST', 'PATCH', 'DELETE'];
        
        for (const method of unsupportedMethods) {
          const response = await appHelper
            .getRequest()
            [method.toLowerCase()]("/v1/user/self")
            .set("Authorization", authHeader)
            .expect(405);

          expect(response.headers.allow).toBe("GET, PUT");
          expect(response.body.error).toBe("Method Not Allowed");
        }
      });
    });
  });

  describe("PUT /v1/user/self - Update User Information", () => {
    describe("Positive Test Cases", () => {
      test("should update first_name successfully", async () => {
        const updateData = {
          first_name: "UpdatedAuth"
        };

        const response = await appHelper
          .getRequest()
          .put("/v1/user/self")
          .set("Authorization", authHeader)
          .send(updateData)
          .expect(200);

        expect(response.body.first_name).toBe("UpdatedAuth");
        expect(response.body.last_name).toBe(testUser.last_name); // Unchanged
        expect(response.body.email).toBe(testUser.email); // Unchanged
        expect(response.body).not.toHaveProperty('password');
        
        // Verify account_updated timestamp changed
        expect(new Date(response.body.account_updated).getTime())
          .toBeGreaterThan(new Date(response.body.account_created).getTime());
      });

      test("should update last_name successfully", async () => {
        const updateData = {
          last_name: "UpdatedUser"
        };

        const response = await appHelper
          .getRequest()
          .put("/v1/user/self")
          .set("Authorization", authHeader)
          .send(updateData)
          .expect(200);

        expect(response.body.last_name).toBe("UpdatedUser");
        expect(response.body.first_name).toBe(testUser.first_name); // Unchanged
      });

      test("should update password successfully", async () => {
        const updateData = {
          password: "NewSecurePass456!"
        };

        const response = await appHelper
          .getRequest()
          .put("/v1/user/self")
          .set("Authorization", authHeader)
          .send(updateData)
          .expect(200);

        // Password should not be in response
        expect(response.body).not.toHaveProperty('password');
        
        // Verify old password no longer works
        const oldAuthHeader = "Basic " + Buffer.from(`${testUser.email}:${testUser.password}`).toString('base64');
        await appHelper
          .getRequest()
          .get("/v1/user/self")
          .set("Authorization", oldAuthHeader)
          .expect(401);
        
        // Verify new password works
        const newAuthHeader = "Basic " + Buffer.from(`${testUser.email}:${updateData.password}`).toString('base64');
        await appHelper
          .getRequest()
          .get("/v1/user/self")
          .set("Authorization", newAuthHeader)
          .expect(200);
      });

      test("should update multiple fields at once", async () => {
        const updateData = {
          first_name: "Multi",
          last_name: "Update",
          password: "MultiUpdate123!"
        };

        const response = await appHelper
          .getRequest()
          .put("/v1/user/self")
          .set("Authorization", authHeader)
          .send(updateData)
          .expect(200);

        expect(response.body.first_name).toBe("Multi");
        expect(response.body.last_name).toBe("Update");
        expect(response.body).not.toHaveProperty('password');
        
        // Verify new password works
        const newAuthHeader = "Basic " + Buffer.from(`${testUser.email}:${updateData.password}`).toString('base64');
        await appHelper
          .getRequest()
          .get("/v1/user/self")
          .set("Authorization", newAuthHeader)
          .expect(200);
      });

      test("should handle name updates with special characters", async () => {
        const updateData = {
          first_name: "José María",
          last_name: "García-López"
        };

        const response = await appHelper
          .getRequest()
          .put("/v1/user/self")
          .set("Authorization", authHeader)
          .send(updateData)
          .expect(200);

        expect(response.body.first_name).toBe(updateData.first_name);
        expect(response.body.last_name).toBe(updateData.last_name);
      });
    });

    describe("Negative Test Cases", () => {
      test("should return 401 for missing authentication", async () => {
        const updateData = {
          first_name: "Should Fail"
        };

        const response = await appHelper
          .getRequest()
          .put("/v1/user/self")
          .send(updateData)
          .expect(401);

        expect(response.body.error).toBe("Unauthorized");
        expect(response.body.message).toBe("Authentication required. Please provide valid credentials.");
      });

      test("should return 401 for invalid credentials", async () => {
        const updateData = {
          first_name: "Should Fail"
        };
        
        const invalidAuthHeader = "Basic " + Buffer.from("invalid@example.com:wrongpassword").toString('base64');

        const response = await appHelper
          .getRequest()
          .put("/v1/user/self")
          .set("Authorization", invalidAuthHeader)
          .send(updateData)
          .expect(401);

        expect(response.body.error).toBe("Unauthorized");
      });

      test("should return 400 for attempting to update forbidden fields", async () => {
        const forbiddenFields = [
          { email: "newemail@example.com" },
          { id: "new-uuid-value" },
          { account_created: "2020-01-01T00:00:00.000Z" },
          { account_updated: "2020-01-01T00:00:00.000Z" }
        ];

        for (const updateData of forbiddenFields) {
          const response = await appHelper
            .getRequest()
            .put("/v1/user/self")
            .set("Authorization", authHeader)
            .send(updateData)
            .expect(400);

          expect(response.body.error).toBe("Bad Request");
          expect(response.body.message).toMatch(/cannot be updated/);
        }
      });

      test("should return 400 for invalid password format", async () => {
        const invalidPasswords = [
          "short",           // Too short
          "nouppercase123!", // No uppercase
          "NOLOWERCASE123!", // No lowercase
          "NoNumber!",       // No number
          "NoSpecialChar123" // No special character
        ];

        for (const password of invalidPasswords) {
          const updateData = { password };

          const response = await appHelper
            .getRequest()
            .put("/v1/user/self")
            .set("Authorization", authHeader)
            .send(updateData)
            .expect(400);

          expect(response.body.error).toBe("Bad Request");
          expect(response.body.message).toBe("Validation failed");
        }
      });

      test("should return 400 for invalid name formats", async () => {
        const invalidNames = [
          { first_name: "" },                    // Empty
          { last_name: "" },                     // Empty
          { first_name: "a".repeat(101) },       // Too long
          { last_name: "b".repeat(101) }         // Too long
        ];

        for (const updateData of invalidNames) {
          const response = await appHelper
            .getRequest()
            .put("/v1/user/self")
            .set("Authorization", authHeader)
            .send(updateData)
            .expect(400);

          expect(response.body.error).toBe("Bad Request");
          expect(response.body.message).toBe("Validation failed");
        }
      });

      test("should return 400 for no valid fields provided", async () => {
        const response = await appHelper
          .getRequest()
          .put("/v1/user/self")
          .set("Authorization", authHeader)
          .send({})
          .expect(400);

        expect(response.body.error).toBe("Bad Request");
        expect(response.body.message).toBe("No valid fields provided for update");
      });

      test("should return 400 for only invalid fields", async () => {
        const updateData = {
          email: "newemail@example.com",
          account_created: "2020-01-01T00:00:00.000Z"
        };

        const response = await appHelper
          .getRequest()
          .put("/v1/user/self")
          .set("Authorization", authHeader)
          .send(updateData)
          .expect(400);

        expect(response.body.error).toBe("Bad Request");
        expect(response.body.message).toMatch(/cannot be updated/);
      });
    });

    describe("Database Verification Tests", () => {
      test("should verify password is properly hashed after update", async () => {
        const newPassword = "NewHashedPass789!";
        const updateData = {
          password: newPassword
        };

        await appHelper
          .getRequest()
          .put("/v1/user/self")
          .set("Authorization", authHeader)
          .send(updateData)
          .expect(200);

        // Verify password is hashed in database
        const user = await User.findByEmail(testUser.email);
        expect(user.password).not.toBe(newPassword);
        expect(user.password).toMatch(/^\$2[ab]\$\d{2}\$/); // BCrypt hash pattern
        
        // Verify new password validation works
        const isValid = await user.validatePassword(newPassword);
        expect(isValid).toBe(true);
        
        const isOldValid = await user.validatePassword(testUser.password);
        expect(isOldValid).toBe(false);
      });

      test("should verify account_updated timestamp changes on update", async () => {
        // Get initial timestamp
        const initialResponse = await appHelper
          .getRequest()
          .get("/v1/user/self")
          .set("Authorization", authHeader);
        
        const initialTimestamp = new Date(initialResponse.body.account_updated);
        
        // Wait a small amount to ensure timestamp difference
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Update user
        const updateData = {
          first_name: "TimestampTest"
        };

        const updateResponse = await appHelper
          .getRequest()
          .put("/v1/user/self")
          .set("Authorization", authHeader)
          .send(updateData)
          .expect(200);

        const updatedTimestamp = new Date(updateResponse.body.account_updated);
        
        expect(updatedTimestamp.getTime()).toBeGreaterThan(initialTimestamp.getTime());
        expect(updateResponse.body.account_created).toBe(initialResponse.body.account_created);
      });
    });

    describe("Edge Case Tests", () => {
      test("should handle concurrent update requests", async () => {
        const updateRequests = Array(3).fill().map((_, i) => 
          appHelper
            .getRequest()
            .put("/v1/user/self")
            .set("Authorization", authHeader)
            .send({ first_name: `Concurrent${i}` })
        );

        const responses = await Promise.all(updateRequests);

        // All requests should succeed
        responses.forEach(response => {
          expect(response.status).toBe(200);
        });

        // Final state should be one of the updates
        const finalResponse = await appHelper
          .getRequest()
          .get("/v1/user/self")
          .set("Authorization", authHeader);

        expect(finalResponse.body.first_name).toMatch(/^Concurrent[0-2]$/);
      });

      test("should handle boundary values for name lengths", async () => {
        const updateData = {
          first_name: "a".repeat(100), // Maximum allowed
          last_name: "b".repeat(100)   // Maximum allowed
        };

        const response = await appHelper
          .getRequest()
          .put("/v1/user/self")
          .set("Authorization", authHeader)
          .send(updateData)
          .expect(200);

        expect(response.body.first_name).toBe(updateData.first_name);
        expect(response.body.last_name).toBe(updateData.last_name);
      });
    });
  });
});