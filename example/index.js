const Koa = require('koa')
const Router = require('koa-router')
const app = new Koa()
const router = new Router()
const views = require('koa-liveload-views')
app.use(views(__dirname + '/views', {
	watch: {
		liveLoadFlag: true,
		path: [__dirname + '/views']
	}
}))


router.get('/', async (ctx, next) => {
	await ctx.render('index.html')
})

app.use(router.routes())
	.use(router.allowedMethods())

app.listen(5000, '0.0.0.0')
console.log('server is running on port 5000!')