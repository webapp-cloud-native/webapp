const AppHelper = require("../helpers/app-helper");
const TestDatabase = require("../config/test-database");
const { User } = require("../../src/models/User");

describe("User Management API", () => {
  let appHelper;
  let testUser;
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
    // Clean up any existing test data
    await TestDatabase.clearData();
    
    // Create a base test user for authentication tests
    testUser = {
      email: "test@example.com",
      password: "TestPass123!",
      first_name: "Test",
      last_name: "User"
    };
    
    // Generate auth header for authenticated requests
    authHeader = "Basic " + Buffer.from(`${testUser.email}:${testUser.password}`).toString('base64');
  });

  describe("POST /v1/user - Create User", () => {
    describe("Positive Test Cases", () => {
      test("should create user with valid data", async () => {
        const userData = {
          email: "john.doe@example.com",
          password: "SecurePass123!",
          first_name: "John",
          last_name: "Doe"
        };

        const response = await appHelper
          .getRequest()
          .post("/v1/user")
          .send(userData)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.email).toBe(userData.email);
        expect(response.body.first_name).toBe(userData.first_name);
        expect(response.body.last_name).toBe(userData.last_name);
        expect(response.body).toHaveProperty('account_created');
        expect(response.body).toHaveProperty('account_updated');
        
        // Ensure password is not returned
        expect(response.body).not.toHaveProperty('password');
      });

      test("should create user with different valid email formats", async () => {
        const validEmails = [
          "user+tag@domain.com",
          "user.name@domain.co.uk", 
          "123user@domain.org",
          "user_name@sub.domain.com"
        ];

        for (let i = 0; i < validEmails.length; i++) {
          const userData = {
            email: validEmails[i],
            password: "TestPass123!",
            first_name: "Test",
            last_name: `User${i}`
          };

          const response = await appHelper
            .getRequest()
            .post("/v1/user")
            .send(userData)
            .expect(201);

          expect(response.body.email).toBe(validEmails[i]);
        }
      });

      test("should create user with minimum valid name lengths", async () => {
        const userData = {
          email: "min@example.com",
          password: "MinPass123!",
          first_name: "A",
          last_name: "B"
        };

        const response = await appHelper
          .getRequest()
          .post("/v1/user")
          .send(userData)
          .expect(201);

        expect(response.body.first_name).toBe("A");
        expect(response.body.last_name).toBe("B");
      });

      test("should create user with maximum valid name lengths", async () => {
        const userData = {
          email: "max@example.com",
          password: "MaxPass123!",
          first_name: "a".repeat(100), // 100 characters
          last_name: "b".repeat(100)   // 100 characters
        };

        const response = await appHelper
          .getRequest()
          .post("/v1/user")
          .send(userData)
          .expect(201);

        expect(response.body.first_name).toBe(userData.first_name);
        expect(response.body.last_name).toBe(userData.last_name);
      });
    });

    describe("Negative Test Cases", () => {
      test("should return 400 for duplicate email", async () => {
        // Create first user
        await appHelper
          .getRequest()
          .post("/v1/user")
          .send(testUser)
          .expect(201);

        // Attempt to create second user with same email
        const duplicateUser = {
          email: testUser.email,
          password: "DifferentPass123!",
          first_name: "Different",
          last_name: "User"
        };

        const response = await appHelper
          .getRequest()
          .post("/v1/user")
          .send(duplicateUser)
          .expect(400);

        expect(response.body.error).toBe("Bad Request");
        expect(response.body.message).toBe("User with this email already exists");
      });

      test("should return 400 for invalid email format", async () => {
        const invalidEmails = [
          "invalid-email",
          "@domain.com",
          "user@",
          "user@@domain.com",
          "user space@domain.com",
          ""
        ];

        for (const invalidEmail of invalidEmails) {
          const userData = {
            email: invalidEmail,
            password: "TestPass123!",
            first_name: "Test",
            last_name: "User"
          };

          const response = await appHelper
            .getRequest()
            .post("/v1/user")
            .send(userData)
            .expect(400);

          expect(response.body.error).toBe("Bad Request");
          expect(response.body.message).toBe("Validation failed");
        }
      });

      test("should return 400 for weak passwords", async () => {
        const weakPasswords = [
          "short",           // Too short
          "nouppercase123!", // No uppercase
          "NOLOWERCASE123!", // No lowercase
          "NoNumber!",       // No number
          "NoSpecialChar123" // No special character
        ];

        for (const weakPassword of weakPasswords) {
          const userData = {
            email: `test${Date.now()}@example.com`,
            password: weakPassword,
            first_name: "Test",
            last_name: "User"
          };

          const response = await appHelper
            .getRequest()
            .post("/v1/user")
            .send(userData)
            .expect(400);

          expect(response.body.error).toBe("Bad Request");
          expect(response.body.message).toBe("Validation failed");
        }
      });

      test("should return 400 for missing required fields", async () => {
        const testCases = [
          { password: "TestPass123!", first_name: "Test", last_name: "User" }, // Missing email
          { email: "test@example.com", first_name: "Test", last_name: "User" }, // Missing password
          { email: "test@example.com", password: "TestPass123!", last_name: "User" }, // Missing first_name
          { email: "test@example.com", password: "TestPass123!", first_name: "Test" }, // Missing last_name
        ];

        for (const userData of testCases) {
          const response = await appHelper
            .getRequest()
            .post("/v1/user")
            .send(userData)
            .expect(400);

          expect(response.body.error).toBe("Bad Request");
          expect(response.body.message).toBe("Validation failed");
          expect(response.body.details).toBeInstanceOf(Array);
        }
      });

      test("should return 400 for empty name fields", async () => {
        const userData = {
          email: "test@example.com",
          password: "TestPass123!",
          first_name: "",
          last_name: ""
        };

        const response = await appHelper
          .getRequest()
          .post("/v1/user")
          .send(userData)
          .expect(400);

        expect(response.body.error).toBe("Bad Request");
        expect(response.body.message).toBe("Validation failed");
      });

      test("should return 400 for name fields exceeding maximum length", async () => {
        const userData = {
          email: "test@example.com",
          password: "TestPass123!",
          first_name: "a".repeat(101), // 101 characters - exceeds limit
          last_name: "b".repeat(101)   // 101 characters - exceeds limit
        };

        const response = await appHelper
          .getRequest()
          .post("/v1/user")
          .send(userData)
          .expect(400);

        expect(response.body.error).toBe("Bad Request");
        expect(response.body.message).toBe("Validation failed");
      });

      test("should ignore read-only fields in request", async () => {
        const userData = {
          email: "test@example.com",
          password: "TestPass123!",
          first_name: "Test",
          last_name: "User",
          id: "should-be-ignored",
          account_created: "2020-01-01T00:00:00.000Z",
          account_updated: "2020-01-01T00:00:00.000Z"
        };

        const response = await appHelper
          .getRequest()
          .post("/v1/user")
          .send(userData)
          .expect(201);

        expect(response.body.id).not.toBe("should-be-ignored");
        expect(response.body.account_created).not.toBe("2020-01-01T00:00:00.000Z");
        expect(response.body.account_updated).not.toBe("2020-01-01T00:00:00.000Z");
      });
    });

    describe("Edge Case Tests", () => {
      test("should handle special characters in names", async () => {
        const userData = {
          email: "special@example.com",
          password: "SpecialPass123!",
          first_name: "José María",
          last_name: "García-López"
        };

        const response = await appHelper
          .getRequest()
          .post("/v1/user")
          .send(userData)
          .expect(201);

        expect(response.body.first_name).toBe(userData.first_name);
        expect(response.body.last_name).toBe(userData.last_name);
      });

      test("should handle concurrent user creation requests", async () => {
        const users = Array(5).fill().map((_, i) => ({
          email: `concurrent${i}@example.com`,
          password: "ConcurrentPass123!",
          first_name: `User${i}`,
          last_name: "Test"
        }));

        const requests = users.map(user => 
          appHelper.getRequest().post("/v1/user").send(user)
        );

        const responses = await Promise.all(requests);

        responses.forEach((response, index) => {
          expect(response.status).toBe(201);
          expect(response.body.email).toBe(users[index].email);
        });
      });
    });

    describe("Method Not Allowed Tests", () => {
      test("should return 405 for unsupported methods on /v1/user", async () => {
        const unsupportedMethods = ['GET', 'PUT', 'PATCH', 'DELETE'];
        
        for (const method of unsupportedMethods) {
          const response = await appHelper
            .getRequest()
            [method.toLowerCase()]("/v1/user")
            .expect(405);

          expect(response.headers.allow).toBe("POST");
          expect(response.body.error).toBe("Method Not Allowed");
        }
      });
    });
  });

  describe("Database Verification Tests", () => {
    test("should store password securely with BCrypt", async () => {
      const userData = {
        email: "bcrypt@example.com",
        password: "TestPassword123!",
        first_name: "BCrypt",
        last_name: "Test"
      };

      await appHelper
        .getRequest()
        .post("/v1/user")
        .send(userData)
        .expect(201);

      // Verify password is hashed in database
      const user = await User.findByEmail(userData.email);
      expect(user).toBeTruthy();
      expect(user.password).not.toBe(userData.password);
      expect(user.password).toMatch(/^\$2[ab]\$\d{2}\$/); // BCrypt hash pattern
      
      // Verify password validation works
      const isValid = await user.validatePassword(userData.password);
      expect(isValid).toBe(true);
      
      const isInvalid = await user.validatePassword("wrong-password");
      expect(isInvalid).toBe(false);
    });

    test("should set account_created and account_updated timestamps", async () => {
      const beforeCreation = new Date();
      
      const userData = {
        email: "timestamp@example.com",
        password: "TimestampPass123!",
        first_name: "Timestamp",
        last_name: "Test"
      };

      const response = await appHelper
        .getRequest()
        .post("/v1/user")
        .send(userData)
        .expect(201);

      const afterCreation = new Date();
      
      const accountCreated = new Date(response.body.account_created);
      const accountUpdated = new Date(response.body.account_updated);
      
      expect(accountCreated).toBeInstanceOf(Date);
      expect(accountUpdated).toBeInstanceOf(Date);
      expect(accountCreated.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(accountCreated.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
      expect(accountCreated.getTime()).toBe(accountUpdated.getTime());
    });
  });
});