<!-- [![coverage][cover]][cover-url] -->

<div align="center">
 <h1>CSS-Loader modules json extractor</h1>
</div>

When using css-modules and server rendering with extract-text-webpack-plugin

app.css

```css
.container{
  background: hotpink;
}
```

app.js

```js
import * as React from 'react';
import * as style from "./style.css";
export default ({ path, title, children }) => {
  return (
    <div className={style.container}>
      {children}
    </div>
  )
}
```

ExtractTextPlugin will extract the css into separate file...

**/public/index.css**

```css
  .container-1jdUM {
  padding: 1rem;
  border: solid 1px green; }
```
And webpack will produce something like...
**app/build/app.js**
```js
/***/ "./src/app.css":
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin
module.exports = {"container":"container-1jdUM"};

/***/ }),
...
/***/ "./src/app.js":
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__("./node_modules/react/react.js");
const style = __webpack_require__("./src/app.css");
exports.default = ({ path, title, children }) => {
    return (React.createElement("div", { className: style.container }, children));
};

```
In this case style.container value is *container-1jdUM*
and react will eventually render something like
```html
  <link rel="stylesheet" type="text/css" href="/public/index.css">
  ...
   <div class="container-1jdUM"></div>

```

This all works fine in client side, but when using server rendering, there is a problem...
How does the node.js process get the mappings for container object for server side rendering purpouse ?

You can declare alias that any css import will be an empty object, but in this case server rendering will produce html like this, because there is no mappings between container and css
```html
   <div class=""></div>
```

css-loader-module-json will extract the bindings into separate file... for this case

**app/src/app.css.json**
```json
{"container":"container-1jdUM"}
```

in server side you can use module overloader, and when server-side node process will counter
```js
import * as style from "./style.css";
```
you can use the module overload script by extending the node module loader functionality

```js

var path = require('path');

var Module = require('module').Module
var oldLoad = Module._load;
Module._load = function (request, parent, isMain) {
  var extension = path.extname(request) || '.js';
  if (extension === '.css') {
    let cssModel = path.resolve(path.dirname(parent.filename), request + '.json');
    let obj = require(cssModel);
    return obj;
  }
  var res = oldLoad(request, parent, isMain);
  return res;
};

```

and now your server-side node process will produce also html like this.
```html
   <div class="container-1jdUM"></div>
```

Here is the sample for webpack configuration...
This works only with the css-loader and modules:true combination...

**webpack.config.js**
```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          {
            loader: "css-loader-module-json",
              options: {
                buildPath:path.resolve(__dirname, "src"),
                srcPath:path.resolve(__dirname, "src")
              }
            },
            {
              loader: "css-loader",
              options: {
                importLoaders: 1,
                modules: true // CSS Modules https://github.com/css-modules/css-modules
              }
            }
         ]
      }
    ]
  }
}
```

<h2 align="center">Options</h2>

there is buildPath and srcPath in case when you're building server side script into some other folder (typescript)

|Name|Default|Description|
|:--:|:-----:|:----------|
|`buildPath`|`undefined`|JSON Build destination path|
|`srcPath`|`undefined`|Source path|
