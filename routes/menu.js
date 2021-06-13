const router = require('koa-router')()
const { success, fail, decodeToken } = require('../utils/utils')
const utils = require('../utils/utils')
const Menu = require('../models/menusSchema')
const Roles = require('../models/rolesSchema')
router.prefix('/menu')

// 获取菜单列表
router.post('/list', async (ctx) => {
    const { menuName, menuState } = ctx.request.query;
    const params = {}
    if (menuName) params.menuName = menuName;
    if (menuState) params.menuState = menuState;
    let rootList = await Menu.find(params) || []
    const permissionList = utils.TreeMenu(rootList,null)
    ctx.body = success(permissionList, null);
});

// 菜单新增-修改-删除
router.post('/operate', async (ctx)=>{
    const { _id, action, ...params } = ctx.request.body;
    let res, info;
    try {
        if (action == 'create') {
            res = await Menu.create(params)
            info = '创建成功'
        } else if (action == 'edit') {
            params.updateTime = new Date();
            res = await Menu.findByIdAndUpdate(_id, params);
            info = '编辑成功'
        } else {
            res = await Menu.findByIdAndRemove(_id)
            await Menu.deleteMany({ parentId: { $all: [_id] } })
            info = '删除成功'
        }
        ctx.body = success('', info);
    } catch (error) {
        ctx.body = fail(error.stack);
    }
})

// 根据用户角色获取权限菜单列表

router.get('/getPermissonMenuList', async (ctx)=>{
    const authorization = ctx.request.headers.authorization
    const token = authorization.split(' ')[1]
    const ueserInfo = decodeToken(token)
    const menuList = await getMenuList(ueserInfo.role, ueserInfo.roleList)
    const btnList = getBtnPermissonList(menuList)
    ctx.body = success({menuList, btnList})
})

// 菜单生成处理

async function getMenuList(role, roleList) {
    var rootList
    if (role === 0) { // 0是超级管理员
        rootList = await Menu.find({}) || []
    } else { // 1普通用户
        // 先根据用户的角色列表字段查出对应角色数据
        var roleData = await Roles.find({ _id: { $in: roleList } })
        // 然后根据取出来的角色，取出角色拥有的菜单数据，多角色出现相同的对他进行合并，也就是并集了【去重处理】~
        var resultPermissonList = []
        roleData.forEach(item => {
            resultPermissonList = resultPermissonList.concat([...item.permissionList.checkedKeys, ...item.permissionList.halfCheckedKeys])
        })
        resultPermissonList = [...new Set(resultPermissonList)] // 去重相同的菜单id
        rootList = await Menu.find({ _id: { $in: resultPermissonList } }) || []
    }
    return utils.TreeMenu(rootList, null)
}

// 根据生成的权限菜单过滤出对应的按钮列表
function getBtnPermissonList(list) {
    var result = []
    for (var i = 0; i < list.length; i++) {
        if (list[i].btnList) { // 如果btnList存在 那就证明他是最后一个层级的父节点了
            list[i].btnList.forEach(item => {
                result.push(item.menuCode)
            })
        } else if (list[i].children && !list[i].btnList) {
            result = result.concat(getBtnPermissonList(list[i].children))
        }
    }
    return result
}

module.exports = router;