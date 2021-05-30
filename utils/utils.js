/**
 * 通用工具函数
 */
const log4js = require('./log4js')
const jwt = require('jsonwebtoken')
const config = require('../config')
const CODE = {
    SUCCESS: 200,
    PARAM_ERROR: 10001,//'参数不正确',
    USER_ACCOUNT_ERROR:20001,//用户账号密码错误
    USER_LOGIN_ERROR:20002,//用户未登录
    BUSINESS_ERROR: 30001,//业务请求失败
    AUTH_ERROR: 40001,//认证失败或TOKEN过期
}
module.exports = {
    /**
     * 分页结构封装
     * @param {number} pageNum 
     * @param {number} pageSize 
     */
    pager({ pageNum = 1, pageSize = 10 }) {
        pageNum *= 1;
        pageSize *= 1;
        const skipIndex = (pageNum - 1) * pageSize;
        return {
            page: {
                pageNum,
                pageSize
            },
            skipIndex
        }
    },
    //封装请求成功后的数据结构体
    success(data = '', msg = '', code = CODE.SUCCESS) {
        // log4js.debug(data);
        return {
            code, data, msg
        }
    },
    //失败的数据结构体
    fail(msg = '', code = CODE.BUSINESS_ERROR, data = '') {
        // log4js.debug(msg);
        return {
            code, data, msg
        }
    },
    CODE,
    //验证token
    async checkToken(token,ctx,cb,is){
        jwt.verify(token, config.tokenKey, function (err, data) {
            if(err){
                ctx.body = {
                    code:CODE.AUTH_ERROR, 
                    data:'', 
                    msg:'认证失败或TOKEN过期'
                }
            }else{
                // cb.apply(is);
                cb()
            }
        });
    }
}