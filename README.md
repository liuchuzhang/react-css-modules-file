# React CSS Module File

File reference to add CSS Modules.

```jsx
// app.jsx
import React from 'react'
import Row from './row'
import './app.css'

export default () => {
  return (
    <div className="list">
      <div className="row">
        <Row />
      </div>
    </div>
  )
}

// row.jsx
import React from 'react'
import './row.css'

export default () => <div class="row">row</div>
```

The `app.jsx` rendered as:

```html
<div class="list___c021c">
  <div class="row___c021c">
    <div class="row__d3e0cf">row</div>
  </div>
</div>
```

## Usage

```shell
yarn add babel-plugin-react-css-modules-file css-modules-file-loader -D
```

.babelrc
```js
"plugins": ["babel-plugin-react-css-modules-file"]
``` 

webpack config
```js
{
  test: /\.(sc|c|sa)ss$/,
  use: [
    'style-loader',
    'css-loader',
    'css-modules-file-loader',
    'sass-loader'
  ]
}
```

[demo](https://github.com/liuchuzhang/react-css-modules-file/tree/main/demo/css-modules)