const router = require('koa-router')()
router.prefix('/roles')
router.get('/operate',(ctx)=>{
    ctx.body = {
        "code": 200,
        "data": [
          {
            "_id": "60150cb764de99631b2c3cd3",
            "roleName": "产品经理"
          },
          {
            "_id": "60180b07b1eaed6c45fbebdb",
            "roleName": "研发"
          },
          {
            "_id": "60180b59b1eaed6c45fbebdc",
            "roleName": "测试"
          },
          {
            "_id": "60180b5eb1eaed6c45fbebdd",
            "roleName": "JAVA"
          },
          {
            "_id": "60180b64b1eaed6c45fbebde",
            "roleName": "运维"
          },
          {
            "_id": "60180b69b1eaed6c45fbebdf",
            "roleName": "运营"
          },
          {
            "_id": "60180b76b1eaed6c45fbebe0",
            "roleName": "市场"
          },
          {
            "_id": "60180b80b1eaed6c45fbebe1",
            "roleName": "管理层"
          }
        ],
        "msg": ""
      }
});
module.exports = router;