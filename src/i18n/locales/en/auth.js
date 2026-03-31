const auth = {
  login: {
    title: "Sign In",
    subtitle: "Internal data labeling system",
    newAccount: "Don't have an account?",
    switchToRegister: "Register",
    authenticating: "AUTHENTICATING...",
    submit: "SIGN IN",
    success: "Welcome back, {{username}}!",
    failed: "Login failed",
    required: "Please enter all required information",
    fields: {
      username: { label: "Username", placeholder: "username" },
      password: { label: "Password", placeholder: "••••••••" },
    },
  },
  register: {
    title: "Create a new account",
    submit: "CREATE ACCOUNT",
    creating: "CREATING ACCOUNT...",
    switchToLogin: "Sign in",
    hasAccount: "Already have an account?",
    noAccount: "Don't have an account?",
    success: "Registration successful! Your account is pending approval.",
    successPending:
      "Registration successful! Please wait for administrator approval.",
    failed: "Registration failed",
    fields: {
      username: { label: "Username", placeholder: "username" },
      fullName: { label: "Full name", placeholder: "Nguyen Van A" },
      email: { label: "Email", placeholder: "email@example.com" },
      password: { label: "Password", placeholder: "••••••••" },
      confirmPassword: {
        label: "Confirm password",
        placeholder: "••••••••",
      },
    },
    validation: {
      usernameRequired: "Username is required",
      usernameMin: "Username must be at least 3 characters",
      fullNameRequired: "Full name is required",
      emailRequired: "Email is required",
      emailInvalid: "Invalid email address",
      passwordRequired: "Password is required",
      passwordMin: "Password must be at least 6 characters",
      passwordMismatch: "Passwords do not match",
      shortRequired: "Required",
      shortMin3: "Minimum 3 characters",
      shortMin6: "Minimum 6 characters",
    },
    backendErrors: {
      emailExists: "Email already exists in the system",
      usernameExists: "Username already exists",
      roleNotFound: "Role not found",
      generic: "Registration failed. Please try again.",
    },
  },
  marketing: {
    eyebrow: "Data labeling platform",
    titleLine1: "Label",
    titleLine2: "data",
    titleAccent: "more accurately",
    description:
      "Manage, assign, and track data labeling progress on one platform. Trusted by teams of every size, for datasets of every size.",
    restricted: "Restricted access",
    internalOnly: "Internal only",
  },
};

export default auth;
