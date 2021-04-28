const router = require('koa-router')()
const { checkToken } = require('../utils/utils')
router.prefix('/menu')
router.post('/list',(ctx)=>{
    const { authorization } = ctx.request.header;
    checkToken(authorization,ctx,(res)=>{
        console.log(res);
    });
});
module.exports = router;