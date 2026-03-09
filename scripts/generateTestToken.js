// Script to get Firebase ID token for a user using Email/Password via REST API
// Usage: node generateTestToken.js <email> <password>

const fetch = require("node-fetch"); // npm install node-fetch@2

const apiKey = "AIzaSyCGtYi8PlfJ2F5dPxVDbF0MVyYpUS_2ypE"; // Your Web API Key
const email = process.argv[2] || "your-test-email@example.com";
const password = process.argv[3] || "your-test-password";

if (!(email && password)) {
  console.error("Usage: node generateTestToken.js <email> <password>");
  process.exit(1);
}

(async () => {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    }
  );

  const data = await response.json();
  if (data.idToken) {
    console.log("ID Token:", data.idToken);
  } else {
    console.error("Error signing in:", data);
    process.exit(1);
  }
})();
