const fs = require("fs");
const path = require("path");

const DEPLOYED_PATH = path.join(__dirname, "..", "frontend", "public", "deployed.json");

function writeDeployment(payload) {
  fs.mkdirSync(path.dirname(DEPLOYED_PATH), { recursive: true });
  fs.writeFileSync(DEPLOYED_PATH, JSON.stringify(payload, null, 2), "utf8");
}

module.exports = {
  DEPLOYED_PATH,
  writeDeployment,
};
