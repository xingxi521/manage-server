const router = require('koa-router')()
const Roles = require('../models/rolesSchema')
const { success, fail, pager, CODE } = require('../utils/utils')
router.prefix('/roles')
// 获取角色列表所有数据
router.get('/operate', async (ctx)=>{
  try {
    const res = await Roles.find({}, '_id roleName')
    ctx.body = success(res)
  } catch (error) {
    ctx.body = fail(error.stack)
  }
});
// 获取角色列表分页数据
router.get('/list', async (ctx) => {
  try {
    const { roleName } = ctx.request.query
    const { page, skipIndex } = pager(ctx.request.query)
    const params = {}
    if (roleName) params.roleName =  new RegExp(`^${roleName}`,'ig')
    const query = Roles.find(params) // 查询所有数据
    const list = await query.skip(skipIndex).limit(page.pageSize) // 根据查出的所有数据截取对应页数的数据
    const total = await Roles.countDocuments(params);
    ctx.body = success({
      page: {
        ...page,
        total
      },
      list
    })
  } catch (error) {
    ctx.body = fail(error.stack)
  }
})

// 角色新增和编辑和删除
router.post('/operate', async (ctx) => {
  try {
    const { _id, roleName, remark, action } = ctx.request.body;
    if (action === 'create') {
      if (!roleName) {
        ctx.body = fail('请填写完整再进行新增提交', CODE.PARAM_ERROR)
        return;
      } else {
        //先查一下是否数据库里已经存在
        const repeat = await Roles.findOne({ roleName }, '_id');
        if (repeat) {
          ctx.body = fail('您新增的角色:已经存在无需再次添加', CODE.PARAM_ERROR)
          return;
        } else {
          try {
            const addRoles = new Roles({
              roleName,
              remark: remark? remark : ''
            });
            addRoles.save();
            ctx.body = success({}, '添加角色成功')
          } catch (error) {
            ctx.body = fail('添加角色失败，请联系管理员' + error.stack)
          }
        }
      }
    } else if (action === 'edit') {
      let res = await Roles.updateOne({ _id }, { roleName,remark })
      if (res.nModified) {
        ctx.body = success(res, '修改角色成功！')
        return;
      }
      ctx.body = fail('修改失败，请联系管理员');
    } else if (action === 'delete') {
      let res = await Roles.deleteOne({ _id })
      if (res.deletedCount) {
        ctx.body = success(res, `共删除成功${res.nModified}条`)
        return;
      }
      ctx.body = fail('删除失败');
    }
  } catch (error) {
    ctx.body = fail(error.stack)
  }
});
// 设置角色权限
router.post('/update/permission', async (ctx) => {
  try {
    const { _id, permissionList } = ctx.request.body
    let res = await Roles.updateOne({ _id }, { permissionList })
    if (res.nModified) {
      ctx.body = success(res, '设置角色权限成功！')
      return;
    }
    ctx.body = fail('设置角色权限失败，请联系管理员');
  } catch (error) {
    ctx.body = fail(error.stack)
  }
})
module.exports = router;