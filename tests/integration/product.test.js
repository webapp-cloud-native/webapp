const AppHelper = require("../helpers/app-helper");
const TestDatabase = require("../config/test-database");
const { Product } = require("../../src/models/Product");

describe("Product Management API", () => {
  let appHelper;
  let testUser;
  let authHeader;
  let userId;
  let testProduct;

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

  // Helper function to create a test user
  async function createTestUser() {
    testUser = {
      username: `productowner-${Date.now()}@example.com`, // Fixed: changed from email
      password: "ProductPass123!",
      first_name: "Product",
      last_name: "Owner",
    };

    const createUserResponse = await appHelper
      .getRequest()
      .post("/v1/user")
      .send(testUser)
      .expect(201);

    userId = createUserResponse.body.id;
    authHeader =
      "Basic " +
      Buffer.from(`${testUser.username}:${testUser.password}`).toString(
        "base64"
      );

    return { userId, authHeader };
  }

  beforeEach(async () => {
    // Clean up any existing test data
    await TestDatabase.safeClearData();

    // Create a fresh test user for each test
    await createTestUser();

    // Test product data template
    testProduct = {
      name: "Test Widget",
      description: "A high-quality test widget for testing purposes",
      sku: `TEST-WIDGET-${Date.now()}`, // Unique SKU each time
      manufacturer: "Test Manufacturing Corp",
      quantity: 50,
    };
  });

  describe("POST /v1/product - Create Product", () => {
    describe("Positive Test Cases", () => {
      test("should create product with valid data and authentication", async () => {
        const response = await appHelper
          .getRequest()
          .post("/v1/product")
          .set("Authorization", authHeader)
          .send(testProduct)
          .expect(201);

        expect(response.body).toHaveProperty("id");
        expect(response.body.name).toBe(testProduct.name);
        expect(response.body.description).toBe(testProduct.description);
        expect(response.body.sku).toBe(testProduct.sku);
        expect(response.body.manufacturer).toBe(testProduct.manufacturer);
        expect(response.body.quantity).toBe(testProduct.quantity);
        expect(response.body).toHaveProperty("date_added");
        expect(response.body).toHaveProperty("date_last_updated");
        expect(response.body.owner_user_id).toBe(userId);
      });

      test("should create products with valid quantity boundaries", async () => {
        const quantities = [0, 1, 50, 99, 100]; // Valid range: 0-100

        for (let i = 0; i < quantities.length; i++) {
          const productData = {
            ...testProduct,
            name: `Quantity Test Product ${i}`,
            sku: `QTY-TEST-${Date.now()}-${i}`,
            quantity: quantities[i],
          };

          const response = await appHelper
            .getRequest()
            .post("/v1/product")
            .set("Authorization", authHeader)
            .send(productData)
            .expect(201);

          expect(response.body.quantity).toBe(quantities[i]);
        }
      });

      test("should create products with maximum field lengths", async () => {
        const maxLengthProduct = {
          name: "a".repeat(255),
          description: "b".repeat(2000),
          sku: `MAX-${Date.now()}`,
          manufacturer: "d".repeat(255),
          quantity: 25,
        };

        const response = await appHelper
          .getRequest()
          .post("/v1/product")
          .set("Authorization", authHeader)
          .send(maxLengthProduct)
          .expect(201);

        expect(response.body.name).toBe(maxLengthProduct.name);
        expect(response.body.description).toBe(maxLengthProduct.description);
        expect(response.body.sku).toBe(maxLengthProduct.sku);
        expect(response.body.manufacturer).toBe(maxLengthProduct.manufacturer);
      });

      test("should create products with special characters", async () => {
        const specialProduct = {
          name: "Special Product - Test!",
          description:
            "A product with special characters: @#$%^&*()_+-=[]{}|;':\",./<>?",
          sku: `SPECIAL-${Date.now()}`,
          manufacturer: "Special Manufacturer & Co.",
          quantity: 30,
        };

        const response = await appHelper
          .getRequest()
          .post("/v1/product")
          .set("Authorization", authHeader)
          .send(specialProduct)
          .expect(201);

        expect(response.body.name).toBe(specialProduct.name);
        expect(response.body.description).toBe(specialProduct.description);
        expect(response.body.manufacturer).toBe(specialProduct.manufacturer);
      });
    });

    describe("Negative Test Cases", () => {
      test("should return 401 for missing authentication", async () => {
        const response = await appHelper
          .getRequest()
          .post("/v1/product")
          .send(testProduct)
          .expect(401);

        expect(response.body.error).toBe("Unauthorized");
        expect(response.body.message).toBe(
          "Authentication required. Please provide valid credentials."
        );
      });

      test("should return 401 for invalid authentication", async () => {
        const invalidAuthHeader =
          "Basic " +
          Buffer.from("invalid@example.com:wrongpassword").toString("base64");

        const response = await appHelper
          .getRequest()
          .post("/v1/product")
          .set("Authorization", invalidAuthHeader)
          .send(testProduct)
          .expect(401);

        expect(response.body.error).toBe("Unauthorized");
      });

      test("should return 400 for duplicate SKU", async () => {
        // Create first product
        await appHelper
          .getRequest()
          .post("/v1/product")
          .set("Authorization", authHeader)
          .send(testProduct)
          .expect(201);

        // Attempt to create second product with same SKU
        const duplicateProduct = {
          ...testProduct,
          name: "Different Product",
          description: "Different description",
        };

        const response = await appHelper
          .getRequest()
          .post("/v1/product")
          .set("Authorization", authHeader)
          .send(duplicateProduct)
          .expect(400);

        expect(response.body.error).toBe("Bad Request");
        expect(response.body.message).toBe(
          "Product with this SKU already exists"
        );
      });

      test("should return 400 for missing required fields", async () => {
        const requiredFields = [
          "name",
          "description",
          "sku",
          "manufacturer",
          "quantity",
        ];

        for (const fieldToRemove of requiredFields) {
          const incompleteProduct = { ...testProduct };
          delete incompleteProduct[fieldToRemove];

          const response = await appHelper
            .getRequest()
            .post("/v1/product")
            .set("Authorization", authHeader)
            .send(incompleteProduct)
            .expect(400);

          expect(response.body.error).toBe("Bad Request");
          expect(response.body.message).toBe("Validation failed");
          expect(response.body.details).toBeInstanceOf(Array);
        }
      });

      test("should return 400 for invalid quantity values", async () => {
        const invalidQuantities = [-1, -10, 101, 150, 1000, 1.5, "invalid"];

        for (const invalidQuantity of invalidQuantities) {
          const invalidProduct = {
            ...testProduct,
            sku: `INVALID-QTY-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            quantity: invalidQuantity,
          };

          const response = await appHelper
            .getRequest()
            .post("/v1/product")
            .set("Authorization", authHeader)
            .send(invalidProduct)
            .expect(400);

          expect(response.body.error).toBe("Bad Request");
          expect(response.body.message).toBe("Validation failed");
        }
      });

      test("should return 400 for empty required fields", async () => {
        const emptyFieldTests = [
          { ...testProduct, name: "", sku: `EMPTY-NAME-${Date.now()}` },
          { ...testProduct, description: "", sku: `EMPTY-DESC-${Date.now()}` },
          { ...testProduct, sku: "", name: "Empty SKU Test" },
          { ...testProduct, manufacturer: "", sku: `EMPTY-MFG-${Date.now()}` },
        ];

        for (let i = 0; i < emptyFieldTests.length; i++) {
          const response = await appHelper
            .getRequest()
            .post("/v1/product")
            .set("Authorization", authHeader)
            .send(emptyFieldTests[i])
            .expect(400);

          expect(response.body.error).toBe("Bad Request");
          expect(response.body.message).toBe("Validation failed");
        }
      });

      test("should return 400 for fields exceeding maximum length", async () => {
        const tooLongProduct = {
          name: "a".repeat(256), // Max is 255
          description: "b".repeat(2001), // Max is 2000
          sku: "c".repeat(101), // Max is 100
          manufacturer: "d".repeat(256), // Max is 255
          quantity: 50,
        };

        const response = await appHelper
          .getRequest()
          .post("/v1/product")
          .set("Authorization", authHeader)
          .send(tooLongProduct)
          .expect(400);

        expect(response.body.error).toBe("Bad Request");
        expect(response.body.message).toBe("Validation failed");
      });
    });
  });

  describe("GET /v1/product/:productId - Get Product", () => {
    let createdProductId;

    beforeEach(async () => {
      // Create a product for testing (user already exists from main beforeEach)
      const response = await appHelper
        .getRequest()
        .post("/v1/product")
        .set("Authorization", authHeader)
        .send(testProduct)
        .expect(201);

      createdProductId = response.body.id;
    });

    describe("Positive Test Cases", () => {
      test("should return product by valid ID", async () => {
        const response = await appHelper
          .getRequest()
          .get(`/v1/product/${createdProductId}`)
          .expect(200);

        expect(response.body.id).toBe(createdProductId);
        expect(response.body.name).toBe(testProduct.name);
        expect(response.body.description).toBe(testProduct.description);
        expect(response.body.sku).toBe(testProduct.sku);
        expect(response.body.manufacturer).toBe(testProduct.manufacturer);
        expect(response.body.quantity).toBe(testProduct.quantity);
        expect(response.body.owner_user_id).toBe(userId);
      });

      test("should return product without authentication (public endpoint)", async () => {
        const response = await appHelper
          .getRequest()
          .get(`/v1/product/${createdProductId}`)
          .expect(200);

        expect(response.body.id).toBe(createdProductId);
      });
    });

    describe("Negative Test Cases", () => {
      test("should return 400 for invalid product ID format", async () => {
        const invalidIds = ["abc", "12.5", "-1", "0", "invalid-uuid"];

        for (const invalidId of invalidIds) {
          const response = await appHelper
            .getRequest()
            .get(`/v1/product/${invalidId}`)
            .expect(400);

          expect(response.body.error).toBe("Bad Request");
          expect(response.body.message).toBe("Invalid product ID format");
        }
      });

      test("should return 404 for non-existent product ID", async () => {
        const nonExistentId = 99999;

        const response = await appHelper
          .getRequest()
          .get(`/v1/product/${nonExistentId}`)
          .expect(404);

        expect(response.body.error).toBe("Not Found");
        expect(response.body.message).toBe("Product not found");
      });
    });
  });

  describe("PUT /v1/product/:productId - Update Product (Full)", () => {
    let createdProductId;
    let otherUser;
    let otherAuthHeader;

    beforeEach(async () => {
      // Create a product for testing (user already exists from main beforeEach)
      const response = await appHelper
        .getRequest()
        .post("/v1/product")
        .set("Authorization", authHeader)
        .send(testProduct)
        .expect(201);

      createdProductId = response.body.id;

      // Create another user for ownership tests
      otherUser = {
        username: `other-${Date.now()}@example.com`, // Fixed: changed from email
        password: "OtherPass123!",
        first_name: "Other",
        last_name: "User",
      };

      await appHelper.getRequest().post("/v1/user").send(otherUser).expect(201);

      otherAuthHeader =
        "Basic " +
        Buffer.from(`${otherUser.username}:${otherUser.password}`).toString(
          "base64"
        );
    });

    describe("Positive Test Cases", () => {
      test("should update own product successfully", async () => {
        const updateData = {
          name: "Updated Widget",
          description: "Updated description with new features",
          sku: `UPDATED-WIDGET-${Date.now()}`,
          manufacturer: "Updated Manufacturing Inc",
          quantity: 75,
        };

        const response = await appHelper
          .getRequest()
          .put(`/v1/product/${createdProductId}`)
          .set("Authorization", authHeader)
          .send(updateData)
          .expect(200);

        expect(response.body.name).toBe(updateData.name);
        expect(response.body.description).toBe(updateData.description);
        expect(response.body.sku).toBe(updateData.sku);
        expect(response.body.manufacturer).toBe(updateData.manufacturer);
        expect(response.body.quantity).toBe(updateData.quantity);
        expect(response.body.owner_user_id).toBe(userId);

        // Verify date_last_updated changed
        expect(
          new Date(response.body.date_last_updated).getTime()
        ).toBeGreaterThan(new Date(response.body.date_added).getTime());
      });

      test("should allow keeping same SKU when updating own product", async () => {
        const updateData = {
          name: "Updated Name Only",
          description: testProduct.description,
          sku: testProduct.sku, // Keep same SKU
          manufacturer: testProduct.manufacturer,
          quantity: testProduct.quantity,
        };

        const response = await appHelper
          .getRequest()
          .put(`/v1/product/${createdProductId}`)
          .set("Authorization", authHeader)
          .send(updateData)
          .expect(200);

        expect(response.body.sku).toBe(testProduct.sku);
        expect(response.body.name).toBe(updateData.name);
      });
    });

    describe("Negative Test Cases", () => {
      test("should return 401 for missing authentication", async () => {
        const updateData = {
          name: "Should Fail",
          description: testProduct.description,
          sku: testProduct.sku,
          manufacturer: testProduct.manufacturer,
          quantity: testProduct.quantity,
        };

        const response = await appHelper
          .getRequest()
          .put(`/v1/product/${createdProductId}`)
          .send(updateData)
          .expect(401);

        expect(response.body.error).toBe("Unauthorized");
      });

      test("should return 403 for updating other user's product", async () => {
        const updateData = {
          name: "Unauthorized Update",
          description: testProduct.description,
          sku: `UNAUTHORIZED-${Date.now()}`,
          manufacturer: testProduct.manufacturer,
          quantity: testProduct.quantity,
        };

        const response = await appHelper
          .getRequest()
          .put(`/v1/product/${createdProductId}`)
          .set("Authorization", otherAuthHeader)
          .send(updateData)
          .expect(403);

        expect(response.body.error).toBe("Forbidden");
        expect(response.body.message).toBe(
          "You can only update products that you own"
        );
      });

      test("should return 404 for non-existent product", async () => {
        const updateData = {
          name: "Non-existent Product",
          description: "This should fail",
          sku: "NON-EXIST-001",
          manufacturer: "Test Manufacturer",
          quantity: 10,
        };

        const response = await appHelper
          .getRequest()
          .put(`/v1/product/99999`)
          .set("Authorization", authHeader)
          .send(updateData)
          .expect(404);

        expect(response.body.error).toBe("Not Found");
        expect(response.body.message).toBe("Product not found");
      });

      test("should return 400 for duplicate SKU conflict", async () => {
        // Create another product first
        const anotherProduct = {
          ...testProduct,
          name: "Another Product",
          sku: `ANOTHER-${Date.now()}`,
        };

        const another = await appHelper
          .getRequest()
          .post("/v1/product")
          .set("Authorization", authHeader)
          .send(anotherProduct)
          .expect(201);

        // Try to update first product with second product's SKU
        const updateData = {
          name: testProduct.name,
          description: testProduct.description,
          sku: another.body.sku, // Use the actual SKU from second product
          manufacturer: testProduct.manufacturer,
          quantity: testProduct.quantity,
        };

        const response = await appHelper
          .getRequest()
          .put(`/v1/product/${createdProductId}`)
          .set("Authorization", authHeader)
          .send(updateData)
          .expect(400);

        expect(response.body.error).toBe("Bad Request");
        expect(response.body.message).toBe(
          "Product with this SKU already exists"
        );
      });

      test("should return 400 for forbidden fields in update", async () => {
        const updateData = {
          name: "Valid Name",
          description: "Valid description",
          sku: `VALID-${Date.now()}`,
          manufacturer: "Valid Manufacturer",
          quantity: 50,
          id: 99999, // Forbidden field
          date_added: "2020-01-01T00:00:00.000Z", // Forbidden field
          owner_user_id: "different-user-id", // Forbidden field
        };

        const response = await appHelper
          .getRequest()
          .put(`/v1/product/${createdProductId}`)
          .set("Authorization", authHeader)
          .send(updateData)
          .expect(400);

        expect(response.body.error).toBe("Bad Request");
        expect(response.body.message).toMatch(/cannot be updated/);
      });
    });
  });

  describe("PATCH /v1/product/:productId - Update Product (Partial)", () => {
    let createdProductId;

    beforeEach(async () => {
      const response = await appHelper
        .getRequest()
        .post("/v1/product")
        .set("Authorization", authHeader)
        .send(testProduct)
        .expect(201);

      createdProductId = response.body.id;
    });

    describe("Positive Test Cases", () => {
      test("should update single field (quantity only)", async () => {
        const updateData = {
          quantity: 25,
        };

        const response = await appHelper
          .getRequest()
          .patch(`/v1/product/${createdProductId}`)
          .set("Authorization", authHeader)
          .send(updateData)
          .expect(200);

        expect(response.body.quantity).toBe(25);
        expect(response.body.name).toBe(testProduct.name); // Unchanged
        expect(response.body.sku).toBe(testProduct.sku); // Unchanged
      });

      test("should update multiple fields partially", async () => {
        const updateData = {
          name: "Partially Updated Widget",
          manufacturer: "New Manufacturer Corp",
        };

        const response = await appHelper
          .getRequest()
          .patch(`/v1/product/${createdProductId}`)
          .set("Authorization", authHeader)
          .send(updateData)
          .expect(200);

        expect(response.body.name).toBe(updateData.name);
        expect(response.body.manufacturer).toBe(updateData.manufacturer);
        expect(response.body.description).toBe(testProduct.description); // Unchanged
        expect(response.body.sku).toBe(testProduct.sku); // Unchanged
        expect(response.body.quantity).toBe(testProduct.quantity); // Unchanged
      });
    });
  });

  describe("DELETE /v1/product/:productId - Delete Product", () => {
    let createdProductId;
    let otherAuthHeader;

    beforeEach(async () => {
      const response = await appHelper
        .getRequest()
        .post("/v1/product")
        .set("Authorization", authHeader)
        .send(testProduct)
        .expect(201);

      createdProductId = response.body.id;

      // Create another user for ownership tests
      const otherUser = {
        username: `deleter-${Date.now()}@example.com`, // Fixed: changed from email
        password: "DeletePass123!",
        first_name: "Delete",
        last_name: "User",
      };

      await appHelper.getRequest().post("/v1/user").send(otherUser).expect(201);

      otherAuthHeader =
        "Basic " +
        Buffer.from(`${otherUser.username}:${otherUser.password}`).toString(
          "base64"
        );
    });

    describe("Positive Test Cases", () => {
      test("should delete own product successfully", async () => {
        const response = await appHelper
          .getRequest()
          .delete(`/v1/product/${createdProductId}`)
          .set("Authorization", authHeader)
          .expect(204);

        expect(response.body).toEqual({});

        // Verify product is deleted
        await appHelper
          .getRequest()
          .get(`/v1/product/${createdProductId}`)
          .expect(404);
      });
    });

    describe("Negative Test Cases", () => {
      test("should return 401 for missing authentication", async () => {
        const response = await appHelper
          .getRequest()
          .delete(`/v1/product/${createdProductId}`)
          .expect(401);

        expect(response.body.error).toBe("Unauthorized");
      });

      test("should return 403 for deleting other user's product", async () => {
        const response = await appHelper
          .getRequest()
          .delete(`/v1/product/${createdProductId}`)
          .set("Authorization", otherAuthHeader)
          .expect(403);

        expect(response.body.error).toBe("Forbidden");
        expect(response.body.message).toBe(
          "You can only delete products that you own"
        );
      });

      test("should return 404 for non-existent product", async () => {
        const response = await appHelper
          .getRequest()
          .delete(`/v1/product/99999`)
          .set("Authorization", authHeader)
          .expect(404);

        expect(response.body.error).toBe("Not Found");
        expect(response.body.message).toBe("Product not found");
      });
    });
  });

  describe("Method Not Allowed Tests", () => {
    test("should return 405 for unsupported methods on /v1/product", async () => {
      const unsupportedMethods = ["GET", "PUT", "PATCH", "DELETE"];

      for (const method of unsupportedMethods) {
        const response = await appHelper
          .getRequest()
          [method.toLowerCase()]("/v1/product")
          .set("Authorization", authHeader)
          .expect(405);

        expect(response.headers.allow).toBe("POST");
        expect(response.body.error).toBe("Method Not Allowed");
      }
    });

    test("should return 405 for unsupported methods on /v1/product/:id", async () => {
      const unsupportedMethods = ["POST"];

      for (const method of unsupportedMethods) {
        const response = await appHelper
          .getRequest()
          [method.toLowerCase()]("/v1/product/1")
          .set("Authorization", authHeader)
          .expect(405);

        expect(response.headers.allow).toBe("GET, PUT, PATCH, DELETE");
        expect(response.body.error).toBe("Method Not Allowed");
      }
    });
  });
});
