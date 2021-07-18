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
    // 解码token
    decodeToken(token){
        if (token) {
            return jwt.verify(token, config.tokenKey);
        }
        return ''
    },
    // 递归生成菜单
    TreeMenu(rootList, id) {
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
            item.children = this.TreeMenu(rootList, item._id)
            if (item.children.length === 0 ){
                delete item.children
            } else if (item.children.length > 0 && item.children[0].menuType === 2) {
                item.btnList = item.children
            }
        })
        return result
    },
    // 时间格式化
    formateDate(date, format) {
        let fmt = format || 'yyyy-MM-dd hh:mm:ss'
        if (/(y+)/.test(fmt)) {
            fmt = fmt.replace(RegExp.$1, date.getFullYear())
        }
        const o = {
            'M+': date.getMonth() + 1,
            'd+': date.getDate(),
            'h+': date.getHours(),
            'm+': date.getMinutes(),
            's+': date.getSeconds()
        }
        for (let k in o) {
            if (new RegExp(`(${k})`).test(fmt)) {
                const val = o[k] + '';
                fmt = fmt.replace(RegExp.$1, RegExp.$1.length == 1 ? val : ('00' + val).substr(val.length));
            }
        }
        return fmt;
    }
}