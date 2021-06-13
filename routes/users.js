const router = require('koa-router')()
const Users = require('../models/usersSchema')
const Counter = require('../models/counterSchema')
const utils = require('../utils/utils')
const log4js = require('../utils/log4js')
const jwt = require('jsonwebtoken')
const config = require('../config')
const md5 = require('md5')
router.prefix('/users')
/**
 * 登陆接口
 */
router.post('/login', async function (ctx) {
  try {
    const { userName, userPwd } = ctx.request.body;
    const res = await Users.findOne({
      userName,
      userPwd: md5(userPwd)
    }, 'userId userName userEmail state role deptId roleList');
    if (res) {
      var token = jwt.sign(res._doc, config.tokenKey, { expiresIn: '1h' });
      var data = res._doc;
      data.token = token;
      ctx.body = utils.success(data, '登陆成功！');
    } else {
      ctx.body = utils.fail('账号或密码错误！', utils.CODE.USER_ACCOUNT_ERROR);
    }
  } catch (error) {
    log4js.error(error.msg);
  }
});
//获取用户列表
router.get('/list', async function (ctx) {
  const { userId, userName, state } = ctx.request.query;
  const { page, skipIndex } = utils.pager(ctx.request.query)
  let params = {}
  if (userId) params.userId = userId;
  if (userName) params.userName = userName;
  if (state && state != '0') params.state = state;
  try {
    // 根据条件查询所有用户列表
    const query = Users.find(params, { _id: 0, userPwd: 0 })//查询所有数据
    const list = await query.skip(skipIndex).limit(page.pageSize)//根据查出的所有数据截取对应页数的数据
    const total = await Users.countDocuments(params);
    ctx.body = utils.success({
      page: {
        ...page,
        total
      },
      list
    })
  } catch (error) {
    ctx.body = utils.fail(`查询异常:${error.stack}`)
  }
});

// 获取所有用户列表
router.get('/all/list', async function(ctx){
  try {
    const list = await Users.find({})//查询所有数据
    ctx.body = utils.success(list)
  } catch (error) {
    ctx.body = utils.fail(`查询异常:${error.stack}`)
  }
})

//删除用户数据（软删除）
router.post('/delete', async (ctx) => {
  const { userIds } = ctx.request.body;
  let res = await Users.updateMany({ userId: { $in: userIds } }, { state: 2 });
  if (res.nModified) {
    ctx.body = utils.success(res, `共删除成功${res.nModified}条`)
    return;
  }
  ctx.body = utils.fail('删除失败');
})

//新增和编辑
router.post('/operate', async (ctx) => {
  const { userId, userName, userEmail, mobile, job, state, roleList, deptId, action } = ctx.request.body;
  if (action === 'add') {
    if (!userName || !userEmail || !deptId) {
      ctx.body = utils.fail('请填写完整再进行新增提交', utils.CODE.PARAM_ERROR)
      return;
    } else {
      //先查一下是否数据库里已经存在
      const repeat = await Users.findOne({ $or: [{ userName }, { userEmail }] }, '_id userName userEmail');
      if (repeat) {
        ctx.body = utils.fail(`您新增的用户:${repeat.userName},邮箱:${repeat.userEmail}已经存在~`, utils.CODE.PARAM_ERROR)
        return;
      } else {
        try {
          const countDoc = await Counter.findOneAndUpdate({ _id: 'userId' }, { $inc: { currentIndex: 1 } }, { new: true });
          const addUser = new Users({
            userId: countDoc.currentIndex,
            userName,
            userPwd: md5('123456'),
            userEmail,
            role: 1, //默认普通用户
            roleList,
            job,
            state,
            deptId,
            mobile
          });
          addUser.save();
          ctx.body = utils.success({}, '添加用户成功')
        } catch (error) {
          ctx.body = utils.fail('添加用户失败，请联系管理员' + error.stack)
        }
      }
    }
  } else {
    //检测有没有选择部门
    if (!deptId) {
      ctx.body = util.fail('部门不能为空', utils.CODE.PARAM_ERROR)
      return;
    }
    try {
      await Users.findOneAndUpdate({ userId }, { mobile, job, state, roleList, deptId, });
      ctx.body = utils.success({}, '更新用户数据成功');
    } catch (error) {
      ctx.body = utils.fail('更新用户数据失败');
    }
  }
});


module.exports = router
