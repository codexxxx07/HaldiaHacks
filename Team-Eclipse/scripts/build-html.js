const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");

const html = fs.readFileSync(path.join(projectRoot, "index.html"), "utf8");
const htmlForDist = html
  .replace('href="./dist/styles.css"', 'href="./styles.css"')
  .replace('src="./dist/app.js"', 'src="./app.js"');

fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(path.join(distDir, "index.html"), htmlForDist);

// The shell and UI reference runtime assets as ./src/assets/..., so mirror that
// layout inside dist to keep the deployed bundle self-contained.
fs.cpSync(
  path.join(projectRoot, "src", "assets"),
  path.join(distDir, "src", "assets"),
  { recursive: true }
);
