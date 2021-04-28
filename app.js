const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')

const users = require('./routes/users')
const menu = require('./routes/menu')
const log = require('./utils/log4js')
const router = require('koa-router')()
require('./config/db')
onerror(app)
router.prefix('/api')
app.use(bodyparser({
  enableTypes:['json', 'form', 'text']
}))
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

app.use(views(__dirname + '/views', {
  extension: 'pug'
}))

//logger
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  log.info(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// routes
//一级路由加载二级路由
router.use(users.routes(),users.allowedMethods());
router.use(menu.routes(),menu.allowedMethods());
//全局加载一下一级路由
app.use(router.routes(), router.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
  // console.error('server error', err, ctx)
  log.error(err)
});

module.exports = app
