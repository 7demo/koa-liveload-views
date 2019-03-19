# `koa-liveload-views`

------

> 基于`koa-views`代码基础上，实现了前端页面模板等代码文件保存后浏览器自动刷新。这个中间件或许在快速用koa开发一个小玩具的时候用得上。

### Installation
---

```sh
npm install koa-liveload-views
```

### Example

```javascript
const views = require('koa-liveload-views')

app.use(views(__dirname + 'views', {
	watch: {
		liveLoadFlag: true,
		path: [__dirname + '/views']
	}
}))
```

`liveLoadFlag`只有未`true`时才能实现自动刷新功能。

其他配置同`koa-views`。

### License
---
[MIT](https://github.com/queckezz/koa-views/blob/master/license)

