const { User } = require('../models/User');

class AuthService {

  static parseBasicAuth(authHeader) {
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return null;
    }

    try {
      // Extract base64 encoded credentials
      const base64Credentials = authHeader.slice(6); // Remove 'Basic '
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      
      // Split email:password
      const [email, password] = credentials.split(':');
      
      if (!email || !password) {
        return null;
      }

      return { email, password };
    } catch (error) {
      console.error('Error parsing basic auth:', error);
      return null;
    }
  }

  static async authenticateUser(email, password) {
    try {
      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        return null;
      }

      // Validate password
      const isPasswordValid = await user.validatePassword(password);
      if (!isPasswordValid) {
        return null;
      }

      return user;
    } catch (error) {
      console.error('Error authenticating user:', error);
      return null;
    }
  }

  static async authenticateFromHeader(authHeader) {
    // Parse basic auth credentials
    const credentials = this.parseBasicAuth(authHeader);
    if (!credentials) {
      return null;
    }

    // Authenticate user
    return await this.authenticateUser(credentials.email, credentials.password);
  }
}

module.exports = { AuthService };