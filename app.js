const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
const koajwt = require('koa-jwt')
const log = require('./utils/log4js')
const router = require('koa-router')()
const util = require('./utils/utils')
const cors = require('koa2-cors')
const users = require('./routes/users')
const menu = require('./routes/menu')
const roles = require('./routes/roles')
const dept = require('./routes/dept')
const config = require('./config')

require('./config/db')
onerror(app)
router.prefix('/api')
app.use(bodyparser({
  enableTypes:['json', 'form', 'text']
}))
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))
app.use(cors({
  origin: '*', // 允许跨域的地址，我的理解类似白名单，*代表全部允许
  maxAge: 5, // 每隔5秒发送预检请求，也就是发送两次请求
  credentials: true, // 允许请求携带cookie
  allowMethods: ['OPTIONS', 'GET', 'PUT', 'POST', 'DELETE'], // 请求方式
  allowHeaders: ['Accept', 'Origin', 'Content-type', 'Authorization'],
}))
app.use(views(__dirname + '/views', {
  extension: 'pug'
}))

//logger
// app.use(async (ctx, next) => {
//   const start = new Date()
//   await next()
//   const ms = new Date() - start
//   log.info(`${ctx.method} ${ctx.url} - ${ms}ms`)
// })

app.use(async (ctx, next) => {
  log.info(`get params:${JSON.stringify(ctx.request.query)}`)
  log.info(`post params:${JSON.stringify(ctx.request.body)}`)
  await next().catch((err) => {
    if (err.status == '401') {
      ctx.status = 200;
      ctx.body = util.fail('Token认证失败', util.CODE.AUTH_ERROR)
    } else {
      throw err;
    }
  })
})

app.use(koajwt({ secret: config.tokenKey, key: '' }).unless({
  path: [/^\/api\/users\/login/]
}))

// routes
//一级路由加载二级路由
router.use(users.routes(),users.allowedMethods());
router.use(menu.routes(),menu.allowedMethods());
router.use(roles.routes(),roles.allowedMethods());
router.use(dept.routes(),dept.allowedMethods());
//全局加载一下一级路由
app.use(router.routes(), router.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
  // console.error('server error', err, ctx)
  log.error(err)
});

module.exports = app
