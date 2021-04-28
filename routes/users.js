const router = require('koa-router')()
const Users = require('../models/usersSchema')
const utils = require('../utils/utils')
const log4js = require('../utils/log4js')
const jwt = require('jsonwebtoken')
const config = require('../config')
router.prefix('/users')
/**
 * 登陆接口
 */
router.post('/login', async function (ctx) {
  try {
    const {userName,userPwd} = ctx.request.body;
    const res = await Users.findOne({
      userName,
      userPwd
    });
    if(res){
      var token = jwt.sign(res._doc, config.tokenKey,{ expiresIn: 10 });
      var data = res._doc;
      data.token = token;
      ctx.body = utils.success(data,'登陆成功！');
    }else{
      ctx.body = utils.fail('账号或密码错误！',utils.CODE.USER_ACCOUNT_ERROR);
    }
  } catch (error) {
    log4js.error(error.msg);
  }
});


module.exports = router
