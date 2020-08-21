const fs = require("fs");

const sourceContents = fs.readFileSync("./dist/index.min.js", "utf-8");
const developmentAPIRegex = new RegExp("http://localhost:4000/api", "ig");
const scriptContentsSanitized = sourceContents.replace(
  developmentAPIRegex,
  "https://api.hypothesis.app"
);

fs.writeFileSync("./dist/index.min.js", scriptContentsSanitized);
