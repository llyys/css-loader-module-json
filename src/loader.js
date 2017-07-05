const vm = require("vm");
const fs = require("fs");
const path = require("path");
const { getOptions } = require("loader-utils");
const mkdirp = require("mkdirp");

function extractLoader(content) {
  const callback = this.async();
  const options = getOptions(this) || {};

  const script = new vm.Script(content, {
    filename: this.resourcePath,
    displayErrors: true
  });

  const sandbox = {
    require: resourcePath => {
      const absPath = path
        .resolve(path.dirname(this.resourcePath), resourcePath)
        .split("?")[0];

      return require(absPath); // eslint-disable-line const/no-dynamic-require
    },
    module: {},
    exports: {}
  };

  this.cacheable();

  sandbox.module.exports = sandbox.exports;
  let res = script.runInNewContext(sandbox);
  extractObjectToFile(this.resourcePath, options, res).then(() =>
    callback(null, content)
  );
}

function extractObjectToFile(resourcePath, options, obj) {
  return new Promise((resolve, reject) => {
    let filePath = path.relative(options.srcPath, resourcePath);
    let destFile = path.resolve(options.buildPath, filePath);
    let destDir = path.dirname(destFile);
    mkdirp(destDir, (err, made) => {
      if (err) {
        return reject(err);
      }
      fs.writeFile(destFile + ".json", JSON.stringify(obj), resolve);
    });
  });
}

module.exports = extractLoader;
