/* eslint-disable consistent-return */

const { exec } = require("child_process");
const fs = require("fs");
const inquirer = require("inquirer");

const promiseExec = (command, messageIfError) => {
  try {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(messageIfError || error);
          return;
        }

        resolve({ stdout, stderr });
      });
    });
  } catch (exception) {
    throw new Error(`[release.promiseExec] ${exception.message}`);
  }
};

const releaseToNPM = async (version) => {
  try {
    await promiseExec(
      `npm version ${version} --allow-same-version && npm publish --access public`
    ); // NOTE: --access public is due to the scoped package (@usehypothesis/js).
  } catch (exception) {
    throw new Error(`[release.releaseToNPM] ${exception.message}`);
  }
};

const tagReleaseOnGit = async (version) => {
  try {
    await promiseExec(
      `git tag -a ${version} -m "release ${version}" && git push origin ${version}`
    );
  } catch (exception) {
    throw new Error(`[release.tagReleaseOnGit] ${exception.message}`);
  }
};

const pushReleaseToGit = async () => {
  try {
    await promiseExec("git push origin master");
  } catch (exception) {
    throw new Error(`[release.pushReleaseToGit] ${exception.message}`);
  }
};

const commitReleaseToRepo = async (version) => {
  try {
    await promiseExec(`git add . && git commit -m "release v${version}"`);
  } catch (exception) {
    console.warn(exception);
    throw new Error(`[release.commitReleaseToRepo] ${exception.message}`);
  }
};

const setProductionAPIURL = () => {
  try {
    const sourceContents = fs.readFileSync("./dist/index.min.js", "utf-8");
    const developmentAPIRegex = new RegExp("http://localhost:4000/api", "ig");
    const scriptContentsSanitized = sourceContents.replace(
      developmentAPIRegex,
      "https://api.hypothesis.app"
    );

    fs.writeFileSync("./dist/index.min.js", scriptContentsSanitized);
  } catch (exception) {
    throw new Error(`[release.setProductionAPIURL] ${exception.message}`);
  }
};

const runTests = async () => {
  try {
    await promiseExec(
      "npm run test",
      "❌ Tests failed! Run npm test and correct errors before releasing. \n"
    );
  } catch (exception) {
    throw new Error(`[release.runTests] ${exception}`);
  }
};

const runBuild = async () => {
  try {
    await promiseExec("npm run build");
  } catch (exception) {
    throw new Error(`[release.runBuild] ${exception.message}`);
  }
};

const incrementVersion = (currentVersion, releaseType) => {
  try {
    // NOTE: Cast version parts as integers so we can do math on them below.
    const versionParts = currentVersion
      .split(".")
      .map((versionPart) => parseInt(versionPart, 10));

    if (currentVersion && releaseType && releaseType.includes("Major")) {
      return `${versionParts[0] + 1}.0.0`;
    }

    if (currentVersion && releaseType && releaseType.includes("Minor")) {
      return `${versionParts[0]}.${versionParts[1] + 1}.0`;
    }

    if (currentVersion && releaseType && releaseType.includes("Patch")) {
      return `${versionParts[0]}.${versionParts[1]}.${versionParts[2] + 1}`;
    }

    return currentVersion;
  } catch (exception) {
    throw new Error(`[release.incrementVersion] ${exception.message}`);
  }
};

const getCurrentVersionFromPackageJSON = (packageJSON) => {
  try {
    return packageJSON && packageJSON.version;
  } catch (exception) {
    throw new Error(
      `[release.getCurrentVersionFromPackageJSON] ${exception.message}`
    );
  }
};

const getPackageLockJSON = () => {
  try {
    // NOTE: Reads relative to where the command was initially executed in the command line.
    const packageLockJSON = fs.readFileSync("./package-lock.json", "utf-8");
    return packageLockJSON && JSON.parse(packageLockJSON);
  } catch (exception) {
    throw new Error(`[release.getPackageLockJSON] ${exception.message}`);
  }
};

const getPackageJSON = () => {
  try {
    // NOTE: Reads relative to where the command was initially executed in the command line.
    const packageJSON = fs.readFileSync("./package.json", "utf-8");
    return packageJSON && JSON.parse(packageJSON);
  } catch (exception) {
    throw new Error(`[release.getPackageJSON] ${exception.message}`);
  }
};

const release = async (version) => {
  try {
    const packageJSON = getPackageJSON();
    const packageLockJSON = getPackageLockJSON();
    const currentVersion = getCurrentVersionFromPackageJSON(packageJSON);

    if (!packageJSON) {
      throw new Error(
        "Could not find a package.json file for this project. Are you running this command in the right directory?"
      );
    }

    if (!currentVersion) {
      throw new Error(
        "Could not find a current version in package.json. Try again or double-check your package.json has a version set."
      );
    }

    const { releaseType } = await inquirer.prompt([
      {
        type: "list",
        name: "releaseType",
        message: "What type of release are you deploying?",
        choices: ["Major (x.0.0)", "Minor (0.x.0)", "Patch (0.0.x)"],
      },
    ]);

    const version = incrementVersion(currentVersion, releaseType);

    await runBuild();
    console.log("✅ Build complete!");

    await runTests();
    console.log("✅ Tests passed!");

    setProductionAPIURL();
    console.log("✅ Production URLs updated!");

    await commitReleaseToRepo(version);
    console.log("✅ Release committed to repo!");

    await pushReleaseToGit();
    console.log("✅ Release pushed to repo!");

    await tagReleaseOnGit(version);
    console.log("✅ Version tag pushed to remote repo!");

    await releaseToNPM(version);
    console.log("✅ Released to NPM!");
  } catch (exception) {
    console.warn(`[release] ${exception.message}`);
  }
};

release();
