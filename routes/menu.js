const router = require('koa-router')()
const { success, fail } = require('../utils/utils')
const Menu = require('../models/menusSchema')
router.prefix('/menu')
router.post('/list', async (ctx) => {
    const { menuName, menuState } = ctx.request.query;
    const params = {}
    if (menuName) params.menuName = menuName;
    if (menuState) params.menuState = menuState;
    let rootList = await Menu.find(params) || []
    const permissionList = TreeMenu(rootList,null)
    ctx.body = success(permissionList, null);
});

function TreeMenu(rootList, id) {
    var result = []
    for (var i = 0; i < rootList.length; i++) {
        // 取出parentID数组你最后一项，如果是null 那就证明它是第一级菜单-这里String强制转换是因为 断点调试发现取出来的其实是一个数据对象类型，不是一个基本类型的
        // 所以给他来个强制转换成字符串，才能正常对比他是否相等
        if (String(rootList[i]._doc.parentId[rootList[i]._doc.parentId.length-1]) == String(id)) {
            result.push(rootList[i]._doc)
        }
    }
    // 把遍历出来的一级菜单 加children字段，然后把属于其的菜单往children里加
    result.map(item=>{
        item.children = TreeMenu(rootList, item._id)
        if (item.children.length === 0 ){
            delete item.children
        } else if (item.children.length > 0 && item.children[0].menuType === 2) {
            item.btnList = item.children
        }
    })
    return result
}

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

module.exports = router;