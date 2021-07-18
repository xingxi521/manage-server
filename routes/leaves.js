const router = require('koa-router')()
const Leaves = require('../models/leavesSchema')
const Dept = require('../models/deptSchema')
const utils = require('../utils/utils')
const log4js = require('../utils/log4js')
const jwt = require('jsonwebtoken')
const config = require('../config')
router.prefix('/leave')

// 获取审批列表分页数据
router.get('/list', async function (ctx) {
  try {
    const { applyState, type } = ctx.request.query;
    const { page, skipIndex } = utils.pager(ctx.request.query)
    const authorization = ctx.request.headers.authorization
    const token = authorization.split(' ')[1]
    const ueserInfo = utils.decodeToken(token)
    let params = {}
    if (type === 'approve') { // 待审核列表
      if (applyState == null || Number(applyState) === 0 || applyState === '') { // 全部
        params = {
          "auditFlows.userId": ueserInfo.userId
        }
      } else if (Number(applyState) === 1 || Number(applyState) === 2) { // 待审核状态-审核中
        params = {
          "auditFlows.userId": ueserInfo.userId,
          $or: [{ applyState: 1 }, { applyState: 2 }]
        }
        params.curAuditUserName = ueserInfo.userName
      } else { // 其他状态
        params = {
          "auditFlows.userId": ueserInfo.userId,
          applyState
        }
      }
    } else { // 申请休假列表
      params = {
        "applyUser.userId": ueserInfo.userId
      }
      if (applyState != null && Number(applyState)) params.applyState = applyState;
    }
    // 根据条件查询所有用户列表
    const query = Leaves.find(params)//查询所有数据
    const list = await query.skip(skipIndex).limit(page.pageSize)//根据查出的所有数据截取对应页数的数据
    const total = await Leaves.countDocuments(params);
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

// 审批新增-修改-删除
router.post('/operate', async (ctx)=>{
  const { _id, action, ...params } = ctx.request.body;
  try {
    let res, info;
    const authorization = ctx.request.headers.authorization
    const token = authorization.split(' ')[1]
    const ueserInfo = utils.decodeToken(token)
    if (action == 'create') {
      // 获取申请人所属部门
      let applyPeoPledept = ueserInfo.deptId.pop()
      // 根据部门查找到部门负责人
      const deptData = await Dept.findById(applyPeoPledept)
      // 当前审批人
      params.curAuditUserName = deptData.userName
      // 生成申请单号
      let orderNo = 'XJ' + utils.formateDate(new Date(), 'yyyyMMdd')
      let count = await Leaves.countDocuments()
      orderNo += count
      params.orderNo = orderNo
      // 申请人信息数据
      params.applyUser = {
        userId: ueserInfo.userId,
        userName: ueserInfo.userName,
        userEmail: ueserInfo.userEmail
      }
      // 完整审核人名字
      params.auditUsers = deptData.userName
      // 审批流数据
      const finance = await Dept.find({deptName: { $in: ['人事部门', '财务部门'] }})
      params.auditFlows = [
        { userId: deptData.userId, userName: deptData.userName, userEmail: deptData.userEmail }
      ]
      finance.map(item => {
        params.auditFlows.push({
          userId: item.userId,
          userName: item.userName,
          userEmail: item.userEmail
        })
        params.auditUsers += ',' + item.userName
      })
      // 审批日志
      params.auditLogs = []
      res = await Leaves.create(params)
      info = '创建成功'
    } else if (action === 'delete') {
      const res = await Leaves.findByIdAndUpdate(_id, { applyState: 5 })
      info = '作废成功'
    }
    ctx.body = utils.success('', info);
  } catch (error) {
    ctx.body = utils.fail(error.stack);
  }
})

// 审核接口
router.post('/approve', async (ctx)=>{
  const { _id, action, remark } = ctx.request.body;
  const authorization = ctx.request.headers.authorization
  const token = authorization.split(' ')[1]
  const ueserInfo = utils.decodeToken(token)
  try {
    const doc = await Leaves.findById(_id)
    if (action === 'refuse') {
      const auditLogs = doc.auditLogs
      auditLogs.push({
        userId: ueserInfo.userId,
        userName: ueserInfo.userName,
        createTime: new Date(),
        remark,
        action: '驳回'
      })
      await Leaves.findByIdAndUpdate(_id, { applyState: 3, auditLogs})
    } else {
      if (doc.auditLogs.length === doc.auditFlows.length) { // 证明已经审核完了
        ctx.body = untils.success('','此单子已审核完成，无需再次审核！')
        return
      } else if (doc.auditLogs.length > 1) { // 审核中状态
        const auditLogs = doc.auditLogs
        auditLogs.push({
          userId: ueserInfo.userId,
          userName: ueserInfo.userName,
          createTime: new Date(),
          remark,
          action: '通过'
        })
        await Leaves.findByIdAndUpdate(_id, { applyState: 4, auditLogs})
      } else {
        const auditLogs = doc.auditLogs
        auditLogs.push({
          userId: ueserInfo.userId,
          userName: ueserInfo.userName,
          createTime: new Date(),
          remark,
          action: '通过'
        })
        const curAuditUserName = doc.auditFlows[auditLogs.length].userName
        await Leaves.findByIdAndUpdate(_id, { applyState: 2, auditLogs, curAuditUserName})
      }
    }
    ctx.body = utils.success("", "处理成功");
  } catch (error) {
    ctx.body = utils.fail(`审核失败=>${error.stack}`);
  }
})

// 通知数量接口

router.get('/count', async function (ctx) {
  const authorization = ctx.request.headers.authorization
  const token = authorization.split(' ')[1]
  const ueserInfo = utils.decodeToken(token)
  let params = {}
  try {
    params = {
      "auditFlows.userId": ueserInfo.userId,
      $or: [{ applyState: 1 }, { applyState: 2 }]
    }
    params.curAuditUserName = ueserInfo.userName
    const total = await Leaves.countDocuments(params)
    ctx.body = utils.success(total, '查询成功')
  } catch (error) {
    ctx.body = utils.fail(`查询异常:${error.message}`)
  }
})

module.exports = router
