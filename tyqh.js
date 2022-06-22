/**
 作者：临渊
 日期：6-12
 小程序：统一快乐星球
 入口：活动->种番茄
 功能：除了助力都能完成
 抓包：api.xiaoyisz.com/qiehuang/ga/public/api/login  这个登录包里 body 部分的 全部
 变量：tybody='body@xxxx '  多个账号用 @ 或者 换行 分割 
 定时一天三次，八个小时一次收取冒险奖励
 cron: 10 0/8 * * *
 6-14 更新了AU获取方式，理论上不会过期了
 6-18 更新了收取植物、种新的植物和推送加上昵称，方便辨认（可能）
 6-22 修复了上报挑战失败、洒阳光失败，更新了种植进度（免得老有人说脚本坏了）
 */

 const $ = new Env('统一茄皇');
 const notify = $.isNode() ? require('./sendNotify') : '';
 const {log} = console;
 const Notify = 1; //0为关闭通知，1为打开通知,默认为1
 const debug = 0; //0为关闭调试，1为打开调试,默认为0
 //////////////////////
 let tyau = '';
 let tybody = process.env.tybody;
 let tybodyArr = [];
 let newAuArr = [];
 let tyPlantId = '';
 let plantIdArr = [];
 let auback = 0;
 let data = '';
 let msg = '';
 let taskType = 0;
 let taskTypeArr = [];
 let taskId = '';
 let taskIdArr = [];
 let challengeId = '';
 let adventureId = '';
 let name = '';
 let id = '';
 let idArr = [];
 let progress = 0.00;
 let plantStage = 0;
 let plantStatus = '';
 let helpTaskId = '';
 let helpTaskIdArr = [];
 let giveSunshineBack = 0;
 
 !(async () => {
 
     if (!(await Envs()))
         return;
     else {

         log(`\n\n=============================================    \n脚本执行 - 北京时间(UTC+8)：${new Date(
             new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 +
             8 * 60 * 60 * 1000).toLocaleString()} \n=============================================\n`);

         await poem();
        
         log(`\n=================== 共找到 ${tybodyArr.length} 个账号 ===================`)
 
         if (debug) {
             log(`【debug】 这是你的全部账号数组:\n ${tybodyArr}`);
         }

         for (let index = 0; index < tybodyArr.length; index++) {
            
             tybody = tybodyArr[index];
             let num = index + 1

             log(`\n========= 开始【第 ${num} 个账号】=========\n`)

             if (debug) {
                log(`【debug】 这是你的第 ${num} 个账号数组:\n ${tybody}`);
             }
 
             msg += `\n第${num}个账号运行结果：`

             log('开始获取AU');
             await refreshAu();
             await $.wait(2 * 1000);
             newAuArr[index] = tyau;

             log('开始查询任务');
             await getTask();
             await $.wait(2 * 1000);
             helpTaskIdArr[index] = helpTaskId;

             if (auback != 1){
/*
                 for (let i=0;i<10;i++){
                    log(`开始上报第${i+1}个任务`);
                    await report(i);
                    if (i == 2){
                        await report(i);
                        await report(i);
                        await report(i);
                        await report(i);
                    }
                    await $.wait(2 * 1000);
    
                    log(`开始领取第${i+1}个任务奖励`);
                    await getDrawPriz(i);
                    await $.wait(2 * 1000);
                 }

                 log('开始收取阳光');
                 await getSunshine();
                 await $.wait(2 * 1000);
*/
                 log("开始进行挑战");
                 await startCallenge();
                 await $.wait(2 * 1000);

                 log("开始收取冒险奖励");
                 await queryAdventure();
                 await $.wait(2 * 1000);

                 log("开始进行冒险");
                 await startAdventure();
                 await $.wait(2 * 1000);
    
                 log("开始获取植物详情");
                 await getPlant(index);
                 await $.wait(2 * 1000);
                 plantIdArr[index] = tyPlantId;

                 log("开始洒阳光");
                 do {
                     await giveSunshine();
                     await $.wait(2 * 1000);
                 } while (giveSunshineBack == 1);

                 log("开始查询信息");
                 await getUserInfo();
                 await $.wait(2 * 1000);
                 idArr[index] = id;
             }

         }
         await SendMsg(msg);
     }
 
 })()
     .catch((e) => log(e))
     .finally(() => $.done())

 /**
  * 获取AU
  */
  function refreshAu(timeout = 2*1000) {
    let url = {
       url : `http://api.xiaoyisz.com/qiehuang/ga/public/api/login`,
       headers : {
           "Host": "api.xiaoyisz.com",
           "user-agent": "Mozilla/5.0 (Linux; Android 10; MI 8 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/86.0.4240.99 XWEB/3235 MMWEBSDK/20220204 Mobile Safari/537.36 MMWEBID/6242 MicroMessenger/8.0.20.2080(0x28001435) Process/appbrand0 WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64 miniProgram/wx532ecb3bdaaf92f9",
           "Content-Type": "application/json"
       },
       body : `${tybody}`
    }
    return new Promise((resolve) => {

        if (debug) {
            log(`\n【debug】=============== 这是 获取AU 请求 url ===============`);
            log(JSON.stringify(url));
        }

        $.post(url, async (error, response, data) => {
            try {
                if (debug) {
                    log(`\n\n【debug】===============这是 获取AU 返回data==============`);
                    log(data)
                }

                let result = JSON.parse(data);
                if (result.code == 0) {

                    log(`获取AU成功`)
                    tyau = result.data;

                } else if (result.code == 500) {

                    log(`获取AU失败，请检查你的变量是否正确，如正确更换到环境变量或者配置文件重试`)
                    auback = 1;

                } else {  

                    log(`获取AU失败，原因是：${result.message}`)

                }

            } catch (e) {
                log(e)
            } finally {
                resolve();
            }
        },timeout )
    })
}

 /**
  * 上报任务  
  */
 function report(num) {
     let url = {
        url : `http://api.xiaoyisz.com/qiehuang/ga/user/task/report?taskType=${taskTypeArr[num]}&attachId=${timestampMs()}&taskId=${taskIdArr[num]}`,
        headers : {
            "Host": "api.xiaoyisz.com",
            "authorization": `${tyau}`,
            "user-agent": "Mozilla/5.0 (Linux; Android 10; MI 8 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/86.0.4240.99 XWEB/3235 MMWEBSDK/20220204 Mobile Safari/537.36 MMWEBID/6242 MicroMessenger/8.0.20.2080(0x28001435) Process/appbrand0 WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64 miniProgram/wx532ecb3bdaaf92f9",
            "content-type": "application/json"
        },
     }
     return new Promise((resolve) => {
 
         if (debug) {
             log(`\n【debug】=============== 这是 上报任务 请求 url ===============`);
             log(JSON.stringify(url));
         }
 
         $.get(url, async (error, response, data) => {
             try {
                 if (debug) {
                     log(`\n\n【debug】===============这是 上报任务 返回data==============`);
                     log(data)
                 }
 
                 let result = JSON.parse(data);
                 if (result.code == 904) {

                     refreshAu();

                 }
                 if (result.code == 902) {

                     auback = 1;
                     log(`AU失效，请重抓`)
                     msg += `\nAU失效，请重抓`
 
                 } else if (result.data.status === 1) {
 
                     log(`上报任务成功`)
 
                 } else if (result.data.status == -2 ||result.data.status == 2) { 
 
                     log(`上报任务失败，可能是已经完成`)
 
                 } else {  
 
                     log(`上报任务失败，原因是：${result.message}`)
 
                 }
 
             } catch (e) {
                 log(e)
             } finally {
                 resolve();
             }
         })
     })
 }

 /**
 * 领取奖励  
 */
 function getDrawPriz(num) {
    let url = {
        url : `http://api.xiaoyisz.com/qiehuang/ga/user/task/drawPrize?taskId=${taskIdArr[num]}`,
        headers : {
            "Host": "api.xiaoyisz.com",
            "authorization": `${tyau}`,
            "user-agent": "Mozilla/5.0 (Linux; Android 10; MI 8 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/86.0.4240.99 XWEB/3235 MMWEBSDK/20220204 Mobile Safari/537.36 MMWEBID/6242 MicroMessenger/8.0.20.2080(0x28001435) Process/appbrand0 WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64 miniProgram/wx532ecb3bdaaf92f9",
            "content-type": "application/json"
        },
     }
    return new Promise((resolve) => {

        if (debug) {
            log(`\n【debug】=============== 这是 领取奖励 请求 url ===============`);
            log(JSON.stringify(url));
        }

        $.get(url, async (error, response, data) => {
            try {
                if (debug) {
                    log(`\n\n【debug】===============这是 领取奖励 返回data==============`);
                    log(data)
                }

                let result = JSON.parse(data);
                if (result.code == 904) {

                    refreshAu();

                }
                if (result.code == 902) {

                    auback = 1;
                    log(`AU失效，请重抓`)
                    msg += `\nAU失效，请重抓`

                } else if (result.code === 1000) {

                    log(`任务不是待领取状态`)

                } else if (result.code == 0) { 
                    let back = eval(result.data)
                    log(`${back.name} 任务领取奖励成功`)

                } else {  

                    log(`任务领取奖励失败，原因是：${result.message}`)

                }

            } catch (e) {
                log(e)
            } finally {
                resolve();
            }
        })
    })
 }

 /**
  * 获取任务  
  */
 function getTask(timeout = 2*1000) {
    let url = {
        url : `http://api.xiaoyisz.com/qiehuang/ga/user/task/list`,
        headers : {
            "Host": "api.xiaoyisz.com",
            "authorization": `${tyau}`,
            "user-agent": "Mozilla/5.0 (Linux; Android 10; MI 8 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/86.0.4240.99 XWEB/3235 MMWEBSDK/20220204 Mobile Safari/537.36 MMWEBID/6242 MicroMessenger/8.0.20.2080(0x28001435) Process/appbrand0 WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64 miniProgram/wx532ecb3bdaaf92f9",
            "content-type": "application/json"
        },
     }
    return new Promise((resolve) => {

        if (debug) {
            log(`\n【debug】=============== 这是 获取任务 请求 url ===============`);
            log(JSON.stringify(url));
        }

        $.get(url, async (error, response, data) => {
            try {
                if (debug) {
                    log(`\n\n【debug】===============这是 获取任务 返回data==============`);
                    log(data)
                }

                let result = JSON.parse(data);
                let back = eval(result);
                if (result.code == 901 ||result.code == 902 ||result.code == 903) {

                    auback = 1;
                    log(`AU错误，可能是获取失败，请更换到环境变量或配置文件重试`)
                    msg += `\nAU错误，可能是获取失败，请更换到环境变量或配置文件重试`

                } 
                if (auback != 1 && result.code == 0){
                    for (let i=0;i<10;i++) {
                        if (i == 0) {
                            helpTaskId = back.data[i].taskId;
                        }
                        taskType = back.data[i].taskType;
                        taskTypeArr[i] = taskType;
                        taskId = back.data[i].taskId;
                        taskIdArr[i] = taskId;
                    }
                }

            } catch (e) {
                log(e)
            } finally {
                resolve();
            }
        }, timeout)
    })
 }

 /**
  * 获取植物详情
  */
  function getPlant(num) {
    let url = {
        url : `http://api.xiaoyisz.com/qiehuang/ga/plant/info?userId=-1`,
        headers : {
            "Host": "api.xiaoyisz.com",
            "authorization": `${tyau}`,
            "user-agent": "Mozilla/5.0 (Linux; Android 10; MI 8 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/86.0.4240.99 XWEB/3235 MMWEBSDK/20220204 Mobile Safari/537.36 MMWEBID/6242 MicroMessenger/8.0.20.2080(0x28001435) Process/appbrand0 WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64 miniProgram/wx532ecb3bdaaf92f9",
            "content-type": "application/json"
        },
     }
    return new Promise((resolve) => {

        if (debug) {
            log(`\n【debug】=============== 这是 获取植物详情 请求 url ===============`);
            log(JSON.stringify(url));
        }

        $.get(url, async (error, response, data) => {
            try {
                if (debug) {
                    log(`\n\n【debug】===============这是 获取植物详情 返回data==============`);
                    log(data)
                }

                let result = JSON.parse(data);
                let back = eval(result);
                if (result.code == 904) {

                    refreshAu();

                }
                if (result.code == 0){
                   tyPlantId = result.data.plantId;
                   progress =+ result.data.currentSunshineNum/result.data.needSunshineNum;
                   progress = progress*100;
                   progress = progress.toFixed(2);
                   plantStage =+ result.data.stage;
                } else log(`获取植物详情失败`)

            } catch (e) {
                log(e)
            } finally {
                resolve();
            }
        })
    })
 }

 /**
  * 开始挑战  
  */
  function startCallenge(timeout = 2*1000) {
    let url = {
        url : `http://api.xiaoyisz.com/qiehuang/ga/challenge/start`,
        headers : {
            "Host": "api.xiaoyisz.com",
            "authorization": `${tyau}`,
            "user-agent": "Mozilla/5.0 (Linux; Android 10; MI 8 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/86.0.4240.99 XWEB/3235 MMWEBSDK/20220204 Mobile Safari/537.36 MMWEBID/6242 MicroMessenger/8.0.20.2080(0x28001435) Process/appbrand0 WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64 miniProgram/wx532ecb3bdaaf92f9",
            "content-type": "application/json"
        },
     }
    return new Promise((resolve) => {

        if (debug) {
            log(`\n【debug】=============== 这是 开始挑战 请求 url ===============`);
            log(JSON.stringify(url));
        }

        $.get(url, async (error, response, data) => {
            try {
                if (debug) {
                    log(`\n\n【debug】===============这是 开始挑战 返回data==============`);
                    log(data)
                }

                let result = JSON.parse(data);
                if (result.code == 904) {

                    refreshAu();

                }
                if (auback != 1 && result.code == 0){
                    challengeId = result.data;
                    reportCallenge();
                    $.wait(2 * 1000);
                }

            } catch (e) {
                log(e)
            } finally {
                resolve();
            }
        }, timeout)
    })
 }

 /**
  * 上报挑战  
  */
  function reportCallenge(timeout = 2*1000) {
    let url = {
        url : `http://api.xiaoyisz.com/qiehuang/ga/challenge/report`,
        headers : {
            "Host": "api.xiaoyisz.com",
            "authorization": `${tyau}`,
            "user-agent": "Mozilla/5.0 (Linux; Android 10; MI 8 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/86.0.4240.99 XWEB/3235 MMWEBSDK/20220204 Mobile Safari/537.36 MMWEBID/6242 MicroMessenger/8.0.20.2080(0x28001435) Process/appbrand0 WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64 miniProgram/wx532ecb3bdaaf92f9",
            "Content-Type": "application/json",
        },
        body : `{"battleId":${challengeId},"result":1,"costMillisecond":${randomInt(6500,12000)}}`
     }
    return new Promise((resolve) => {

        if (debug) {
            log(`\n【debug】=============== 这是 上报挑战 请求 url ===============`);
            log(JSON.stringify(url));
        }

        $.post(url, async (error, response, data) => {
            try {
                if (debug) {
                    log(`\n\n【debug】===============这是 上报挑战 返回data==============`);
                    log(data)
                }

                let result = JSON.parse(data);
                let back = eval(result.data);
                if (result.code == 904) {

                    refreshAu();

                }
                if (auback != 1 && result.code == 0){
                    log(`挑战成功`)
                    startCallenge();
                } else log('挑战次数不足')

            } catch (e) {
                log(e)
            } finally {
                resolve();
            }
        }, timeout)
    })
 }

 /**
  * 开始冒险  
  */
  function startAdventure(timeout = 2*1000) {
    let url = {
        url : `http://api.xiaoyisz.com/qiehuang/ga/user/adventure/start`,
        headers : {
            "Host": "api.xiaoyisz.com",
            "authorization": `${tyau}`,
            "user-agent": "Mozilla/5.0 (Linux; Android 10; MI 8 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/86.0.4240.99 XWEB/3235 MMWEBSDK/20220204 Mobile Safari/537.36 MMWEBID/6242 MicroMessenger/8.0.20.2080(0x28001435) Process/appbrand0 WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64 miniProgram/wx532ecb3bdaaf92f9",
            "content-type": "application/json"
        },
     }
    return new Promise((resolve) => {

        if (debug) {
            log(`\n【debug】=============== 这是 开始冒险 请求 url ===============`);
            log(JSON.stringify(url));
        }

        $.get(url, async (error, response, data) => {
            try {
                if (debug) {
                    log(`\n\n【debug】===============这是 开始冒险 返回data==============`);
                    log(data)
                }

                let result = JSON.parse(data);
                if (result.code == 904) {

                    refreshAu();

                }
                if (result.code == 0){
                    log('冒险开始成功')
                } else log('上一次冒险还未结束')

            } catch (e) {
                log(e)
            } finally {
                resolve();
            }
        }, timeout)
    })
 }

 /**
  * 查询冒险  
  */
  function queryAdventure(timeout = 2*1000) {
    let url = {
        url : `http://api.xiaoyisz.com/qiehuang/ga/user/adventure/info?userId=-1&type=2`,
        headers : {
            "Host": "api.xiaoyisz.com",
            "authorization": `${tyau}`,
            "user-agent": "Mozilla/5.0 (Linux; Android 10; MI 8 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/86.0.4240.99 XWEB/3235 MMWEBSDK/20220204 Mobile Safari/537.36 MMWEBID/6242 MicroMessenger/8.0.20.2080(0x28001435) Process/appbrand0 WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64 miniProgram/wx532ecb3bdaaf92f9",
            "content-type": "application/json"
        },
     }
    return new Promise((resolve) => {

        if (debug) {
            log(`\n【debug】=============== 这是 查询冒险 请求 url ===============`);
            log(JSON.stringify(url));
        }

        $.get(url, async (error, response, data) => {
            try {
                if (debug) {
                    log(`\n\n【debug】===============这是 查询冒险 返回data==============`);
                    log(data)
                }

                let result = JSON.parse(data);
                if (result.code == 904) {

                    refreshAu();

                }
                if (result.code == 0){
                    adventureId = result.data.adventureId;
                    reportAdventure();
                } else log('查询上一次冒险失败，可能是未进行')

            } catch (e) {
                log(e)
            } finally {
                resolve();
            }
        }, timeout)
    })
 }

 /**
  * 上报冒险  
  */
  function reportAdventure(timeout = 2*1000) {
    let url = {
        url : `http://api.xiaoyisz.com/qiehuang/ga/user/adventure/drawPrize?adventureId=${adventureId}`,
        headers : {
            "Host": "api.xiaoyisz.com",
            "authorization": `${tyau}`,
            "user-agent": "Mozilla/5.0 (Linux; Android 10; MI 8 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/86.0.4240.99 XWEB/3235 MMWEBSDK/20220204 Mobile Safari/537.36 MMWEBID/6242 MicroMessenger/8.0.20.2080(0x28001435) Process/appbrand0 WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64 miniProgram/wx532ecb3bdaaf92f9",
            "Content-Type": "application/json",
        },
     }
    return new Promise((resolve) => {

        if (debug) {
            log(`\n【debug】=============== 这是 上报冒险 请求 url ===============`);
            log(JSON.stringify(url));
        }

        $.get(url, async (error, response, data) => {
            try {
                if (debug) {
                    log(`\n\n【debug】===============这是 上报冒险 返回data==============`);
                    log(data)
                }

                let result = JSON.parse(data);
                let back = eval(result.data);
                if (result.code == 904) {

                    refreshAu();

                }
                if (result.code == 0){
                    log(`冒险收取成功`)
                } else log('冒险未到时间')

            } catch (e) {
                log(e)
            } finally {
                resolve();
            }
        }, timeout)
    })
 }

 /**
  * 洒阳光  
  */
 function giveSunshine(timeout = 2*1000) {
    let url = {
        url : `http://api.xiaoyisz.com/qiehuang/ga/plant/batchgiveSunshine?plantId=${tyPlantId}`,
        headers : {
            "Host": "api.xiaoyisz.com",
            "authorization": `${tyau}`,
            "user-agent": "Mozilla/5.0 (Linux; Android 10; MI 8 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/86.0.4240.99 XWEB/3235 MMWEBSDK/20220204 Mobile Safari/537.36 MMWEBID/6242 MicroMessenger/8.0.20.2080(0x28001435) Process/appbrand0 WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64 miniProgram/wx532ecb3bdaaf92f9",
            "content-type": "application/json"
        },
     }
    return new Promise((resolve) => {

        if (debug) {
            log(`\n【debug】=============== 这是 洒阳光 请求 url ===============`);
            log(JSON.stringify(url));
        }

        $.get(url, async (error, response, data) => {
            try {
                if (debug) {
                    log(`\n\n【debug】===============这是 洒阳光 返回data==============`);
                    log(data)
                }

                let result = JSON.parse(data);
                let back = eval(result.data);
                if (result.code == 904) {

                    refreshAu();

                }
                if (result.message == "已达到收获阶段") {
                    log("开始收取植物")
                    $.wait(2 * 1000);
                    getHarvest();
                } else if(result.message == "plantId错误"){
                    log(`plantId错误，可能是运行的bug，不用管`)
                } else if(result.message == "只能给自己批量洒阳光") {
                    log("只能给自己批量洒阳光")
                } else if (result.message == "阳光不足") {
                    log("阳光不足")
                    giveSunshineBack = 0;
                } else if (result.message != "阳光不足"){
                    log('洒阳光成功')
                    if (back.currentSunshineNum == back.needSunshineNum){
                        $.wait(3 * 1000);
                        upgrade();
                    }
                    giveSunshineBack = 1;
                }

            } catch (e) {
                log(e)
            } finally {
                resolve();
            }
        }, timeout)
    })
 }

 /**
  * 浇水  
  */
  function upgrade(timeout = 2*1000) {
    let url = {
        url : `http://api.xiaoyisz.com/qiehuang/ga/plant/upgrade?plantId=${tyPlantId}`,
        headers : {
            "Host": "api.xiaoyisz.com",
            "authorization": `${tyau}`,
            "user-agent": "Mozilla/5.0 (Linux; Android 10; MI 8 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/86.0.4240.99 XWEB/3235 MMWEBSDK/20220204 Mobile Safari/537.36 MMWEBID/6242 MicroMessenger/8.0.20.2080(0x28001435) Process/appbrand0 WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64 miniProgram/wx532ecb3bdaaf92f9",
            "content-type": "application/json"
        },
     }
    return new Promise((resolve) => {

        if (debug) {
            log(`\n【debug】=============== 这是 浇水 请求 url ===============`);
            log(JSON.stringify(url));
        }

        $.get(url, async (error, response, data) => {
            try {
                if (debug) {
                    log(`\n\n【debug】===============这是 浇水 返回data==============`);
                    log(data)
                }

                let result = JSON.parse(data);
                let back = eval(result.data);
                if (result.code == 904) {

                    refreshAu();

                }
                if (result.code == 0){
                    log('浇水升级成功')
                }

            } catch (e) {
                log(e)
            } finally {
                resolve();
            }
        }, timeout)
    })
 }

 /**
  * 查询番茄余额  
  */
  function getTomato(timeout = 2*1000) {
    let url = {
        url : `http://api.xiaoyisz.com/qiehuang/ga/user/info?userId=-1`,
        headers : {
            "Host": "api.xiaoyisz.com",
            "authorization": `${tyau}`,
            "user-agent": "Mozilla/5.0 (Linux; Android 10; MI 8 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/86.0.4240.99 XWEB/3235 MMWEBSDK/20220204 Mobile Safari/537.36 MMWEBID/6242 MicroMessenger/8.0.20.2080(0x28001435) Process/appbrand0 WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64 miniProgram/wx532ecb3bdaaf92f9",
            "Content-Type": "application/json"
        },
     }
    return new Promise((resolve) => {

        if (debug) {
            log(`\n【debug】=============== 这是 查询番茄余额 请求 url ===============`);
            log(JSON.stringify(url));
        }

        $.get(url, async (error, response, data) => {
            try {
                if (debug) {
                    log(`\n\n【debug】===============这是 查询番茄余额 返回data==============`);
                    log(data)
                }

                let result = JSON.parse(data);
                let back = eval(result.data);
                if (result.code == 904) {

                    refreshAu();

                }
                if (result.code == 0){
                    if (plantStage == 0) {
                        plantStatus = '发育期';
                    } else if (plantStage == 1) {
                        plantStatus = '幼苗期';
                    } else if (plantStage == 2) {
                        plantStatus = '开花期';
                    } else if (plantStage == 3) {
                        plantStatus = '结果期';
                    }
                    log(`查询成功，账号[${name}]番茄余额为：${back.tomatoNum}，植物状态为：${plantStatus}，进度：${progress}%`)
                    msg += `\n账号[${name}]番茄余额为：${back.tomatoNum}，植物状态为：${plantStatus}，进度：${progress}%`
                }

            } catch (e) {
                log(e)
            } finally {
                resolve();
            }
        }, timeout)
    })
 }

 /**
  * 收取阳光  
  */
  function getSunshine(timeout = 2*1000) {
    let url = {
        url : `http://api.xiaoyisz.com/qiehuang/ga/user/daily/pickup`,
        headers : {
            "Host": "api.xiaoyisz.com",
            "authorization": `${tyau}`,
            "user-agent": "Mozilla/5.0 (Linux; Android 10; MI 8 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/86.0.4240.99 XWEB/3235 MMWEBSDK/20220204 Mobile Safari/537.36 MMWEBID/6242 MicroMessenger/8.0.20.2080(0x28001435) Process/appbrand0 WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64 miniProgram/wx532ecb3bdaaf92f9",
            "content-type": "application/json"
        },
     }
    return new Promise((resolve) => {

        if (debug) {
            log(`\n【debug】=============== 这是 收取阳光 请求 url ===============`);
            log(JSON.stringify(url));
        }

        $.get(url, async (error, response, data) => {
            try {
                if (debug) {
                    log(`\n\n【debug】===============这是 收取阳光 返回data==============`);
                    log(data)
                }

                let result = JSON.parse(data);
                if (result.code == 904) {

                    refreshAu();

                }
                if (result.code == 0){
                    log('收取阳光成功')
                } else if (result.code == 1000){
                    log('收取阳光失败，无可收取的阳光')
                } else log(`收取失败，原因是：${result.message}`)

            } catch (e) {
                log(e)
            } finally {
                resolve();
            }
        }, timeout)
    })
 }

/**
 * 收植物
 */
function getHarvest(timeout = 2*1000) {
    let url = {
        url : `http://api.xiaoyisz.com/qiehuang/ga/plant/harvest?plantId=${tyPlantId}`,
        headers : {
            "Host": "api.xiaoyisz.com",
            "authorization": `${tyau}`,
            "user-agent": "Mozilla/5.0 (Linux; Android 10; MI 8 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/86.0.4240.99 XWEB/3235 MMWEBSDK/20220204 Mobile Safari/537.36 MMWEBID/6242 MicroMessenger/8.0.20.2080(0x28001435) Process/appbrand0 WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64 miniProgram/wx532ecb3bdaaf92f9",
            "Content-Type": "application/json",
        },
    }
    return new Promise((resolve) => {

        if (debug) {
            log(`\n【debug】=============== 这是 收植物 请求 url ===============`);
            log(JSON.stringify(url));
        }

        $.get(url, async (error, response, data) => {
            try {
                if (debug) {
                    log(`\n\n【debug】===============这是 收植物 返回data==============`);
                    log(data)
                }

                let result = JSON.parse(data);
                let back = eval(result.data);
                if (result.code == 904) {

                    refreshAu();

                }
                if (result.code == 0){
                    log(`植物奖励收取成功，获得${back.infos[0].num}个番茄`)
                    getNewPlant();
                } else if (result.code == 1000){
                    log(`植物奖励已收取`)
                } else log(`植物奖励收取失败，原因是：${result.message}`)

            } catch (e) {
                log(e)
            } finally {
                resolve();
            }
        }, timeout)
    })
}

/**
 * 种植物
 */
function getNewPlant(timeout = 2*1000) {
    let url = {
        url : `http://api.xiaoyisz.com/qiehuang/ga/plant/start`,
        headers : {
            "Host": "api.xiaoyisz.com",
            "authorization": `${tyau}`,
            "user-agent": "Mozilla/5.0 (Linux; Android 10; MI 8 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/86.0.4240.99 XWEB/3235 MMWEBSDK/20220204 Mobile Safari/537.36 MMWEBID/6242 MicroMessenger/8.0.20.2080(0x28001435) Process/appbrand0 WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64 miniProgram/wx532ecb3bdaaf92f9",
            "Content-Type": "application/json",
        },
    }
    return new Promise((resolve) => {

        if (debug) {
            log(`\n【debug】=============== 这是 种植物 请求 url ===============`);
            log(JSON.stringify(url));
        }

        $.get(url, async (error, response, data) => {
            try {
                if (debug) {
                    log(`\n\n【debug】===============这是 种植物 返回data==============`);
                    log(data)
                }

                let result = JSON.parse(data);
                let back = eval(result.data);
                if (result.code == 904) {

                    refreshAu();

                }
                if (result.code == 0){
                    log(`种新的植物成功`)
                    tyPlantId = back.plantId;
                    giveSunshine();
                } else if (result.code == 1000){
                    log(`种失败，原因是：已种植`)
                } else log(`种新的植物失败，原因是：${result.message}`)

            } catch (e) {
                log(e)
            } finally {
                resolve();
            }
        }, timeout)
    })
}

/**
 * 获取信息
 */
function getUserInfo(timeout = 2*1000) {
    let url = {
        url : `http://api.xiaoyisz.com/qiehuang/ga/user/info?userId=-1`,
        headers : {
            "Host": "api.xiaoyisz.com",
            "authorization": `${tyau}`,
            "user-agent": "Mozilla/5.0 (Linux; Android 10; MI 8 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/86.0.4240.99 XWEB/3235 MMWEBSDK/20220204 Mobile Safari/537.36 MMWEBID/6242 MicroMessenger/8.0.20.2080(0x28001435) Process/appbrand0 WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64 miniProgram/wx532ecb3bdaaf92f9",
            "Content-Type": "application/json",
        },
    }
    return new Promise((resolve) => {

        if (debug) {
            log(`\n【debug】=============== 这是 获取信息 请求 url ===============`);
            log(JSON.stringify(url));
        }

        $.get(url, async (error, response, data) => {
            try {
                if (debug) {
                    log(`\n\n【debug】===============这是 获取信息 返回data==============`);
                    log(data)
                }

                let result = JSON.parse(data);
                let back = eval(result.data);
                if (result.code == 904) {

                    refreshAu();

                }
                if (result.code == 0){
                    log(`查询昵称成功`);
                    name = back.nickName;
                    id = back.id;
                    getTomato();
                } else log(`获取信息失败，原因是：${result.message}`)

            } catch (e) {
                log(e)
            } finally {
                resolve();
            }
        }, timeout)
    })
}

/**
 * 互助 （num1助力num2）
 */
function doHelp(num1,num2) {
    let url = {
        url : `http://api.xiaoyisz.com/qiehuang/ga/user/task/report?taskType=${taskTypeArr[0]}&attachId=${idArr[num2]}&taskId=${helpTaskIdArr[num1]}`,
        headers : {
            "Host": "api.xiaoyisz.com",
            "authorization": `${newAuArr[num1]}`,
            "user-agent": "Mozilla/5.0 (Linux; Android 10; MI 8 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/86.0.4240.99 XWEB/3235 MMWEBSDK/20220204 Mobile Safari/537.36 MMWEBID/6242 MicroMessenger/8.0.20.2080(0x28001435) Process/appbrand0 WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64 miniProgram/wx532ecb3bdaaf92f9",
            "content-type": "application/json"
        },
    }
    return new Promise((resolve) => {

        if (debug) {
            log(`\n【debug】=============== 这是 互助 请求 url ===============`);
            log(JSON.stringify(url));
        }

        $.get(url, async (error, response, data) => {
            try {
                if (debug) {
                    log(`\n\n【debug】===============这是 互助 返回data==============`);
                    log(data)
                }

                let result = JSON.parse(data);
                if (result.data.status == 1) {

                    log(`去助力[${result.data.nickName}]成功`)

                } else if (result.data.status == 3) {

                    log(`助力失败，可能是已助力过`)

                } else if (result.data.status == 2) {

                    log(`助力失败，该用户被助力次数已达上限`)

                } else {

                    log(`助力失败，原因是：${result.message}`)

                }

            } catch (e) {
                log(e)
            } finally {
                resolve();
            }
        })
    })
}

/**
 * 互助洒阳光 （num1助力num2）
 */
function doHelpGiveSunshine(num1,num2) {
    let url = {
        url : `https://api.xiaoyisz.com/qiehuang/ga/plant/giveSunshine?plantId=${plantIdArr[num2]}`,
        headers : {
            "Host": "api.xiaoyisz.com",
            "authorization": `${newAuArr[num1]}`,
            "user-agent": "Mozilla/5.0 (Linux; Android 10; MI 8 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/86.0.4240.99 XWEB/3235 MMWEBSDK/20220204 Mobile Safari/537.36 MMWEBID/6242 MicroMessenger/8.0.20.2080(0x28001435) Process/appbrand0 WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64 miniProgram/wx532ecb3bdaaf92f9",
            "content-type": "application/json"
        },
    }
    return new Promise((resolve) => {

        if (debug) {
            log(`\n【debug】=============== 这是 互助洒阳光 请求 url ===============`);
            log(JSON.stringify(url));
        }

        $.get(url, async (error, response, data) => {
            try {
                if (debug) {
                    log(`\n\n【debug】===============这是 互助洒阳光 返回data==============`);
                    log(data)
                }

                let result = JSON.parse(data);
                if (result.code == 0) {

                    log(`助力洒阳光成功`)

                } else if (result.code == 1000) {

                    log(`助力洒阳光失败，今日已达上限`)

                } else {

                    log(`助力洒阳光失败，原因是：${result.message}`)

                }

            } catch (e) {
                log(e)
            } finally {
                resolve();
            }
        })
    })
}
 // ============================================变量检查============================================ \\
 async function Envs() {
     if (tybody) {
        if (tybody.indexOf("@") != -1) {
            tybody.split("@").forEach((item) => {
                tybodyArr.push(item);
            });
        } else if (tybody.indexOf("\n") != -1){
            tybody.split("\n").forEach((item) => {
                tybodyArr.push(item);
            });
        } else {
            tybodyArr.push(tybody);
        }
    } else {
        log(`\n 【${$.name}】：未填写变量 tybody`)
        return ;
    }

     return true;
 }
 
 // ============================================发送消息============================================ \\
 async function SendMsg(message) {
     if (!message)
         return;
 
     if (Notify > 0) {
         if ($.isNode()) {
             var notify = require('./sendNotify');
             await notify.sendNotify($.name, message);
         } else {
             $.msg(message);
         }
     } else {
         log(message);
     }
 }
 
 /**
  * 随机数生成
  */
 function randomString(e) {
     e = e || 32;
     var t = "QWERTYUIOPASDFGHJKLZXCVBNM1234567890",
         a = t.length,
         n = "";
     for (i = 0; i < e; i++)
         n += t.charAt(Math.floor(Math.random() * a));
     return n
 }
 
 /**
  * 随机整数生成
  */
 function randomInt(min, max) {
     return Math.round(Math.random() * (max - min) + min)
 }

 /**
  * 获取毫秒时间戳
  */
 function timestampMs(){
    return new Date().getTime();
 }

 /**
  * 获取秒时间戳
  */
 function timestampS(){
    return Date.parse(new Date())/1000;
 }

 /**
  * 获取随机诗词
  */
 function poem(timeout = 3 * 1000) {
	return new Promise((resolve) => {
		let url = {
			url: `https://v1.jinrishici.com/all.json`
		}
		$.get(url, async (err, resp, data) => {
			try {
				data = JSON.parse(data)
				log(`${data.content}  \n————《${data.origin}》${data.author}`);
			} catch (e) {
				log(e, resp);
			} finally {
				resolve()
			}
		}, timeout)
	})
 }

 /**
  * 修改配置文件
  */
  function modify() {
                
    fs.readFile('/ql/data/config/config.sh','utf8',function(err,dataStr){
        if(err){
            return log('读取文件失败！'+err)
        }
        else {
            var result = dataStr.replace(/tyau="[\w-\s/+@]{0,1000}"/g,`tyau="${newAuArr[0]}@${newAuArr[1]}@${newAuArr[2]}"`);
            fs.writeFile('/ql/data/config/config.sh', result, 'utf8', function (err) {
                     if (err) {return log(err);}
                });
            }
    })
 }

 function Env(t, e) { "undefined" != typeof process && JSON.stringify(process.env).indexOf("GITHUB") > -1 && process.exit(0); class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, i) => { s.call(this, t, (t, s, r) => { t ? i(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `🔔${this.name}, 开始!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson(t, e) { let s = e; const i = this.getdata(t); if (i) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, i) => e(i)) }) } runScript(t, e) { return new Promise(s => { let i = this.getdata("@chavy_boxjs_userCfgs.httpapi"); i = i ? i.replace(/\n/g, "").trim() : i; let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r; const [o, h] = i.split("@"), n = { url: `http://${h}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": o, Accept: "*/*" } }; this.post(n, (t, e, i) => s(i)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e); if (!s && !i) return {}; { const i = s ? t : e; try { return JSON.parse(this.fs.readFileSync(i)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), r = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r) } } lodash_get(t, e, s) { const i = e.replace(/\[(\d+)\]/g, ".$1").split("."); let r = t; for (const t of i) if (r = Object(r)[t], void 0 === r) return s; return r } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : ""; if (r) try { const t = JSON.parse(r); e = t ? this.lodash_get(t, i, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i), h = i ? "null" === o ? null : o || "{}" : "{}"; try { const e = JSON.parse(h); this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i) } catch (e) { const o = {}; this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i) } } else s = this.setval(t, e); return s } getval(t) { return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null } setval(t, e) { return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon() ? (this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) })) : this.isQuanX() ? (this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t))) : this.isNode() && (this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) })) } post(t, e = (() => { })) { if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.post(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) }); else if (this.isQuanX()) t.method = "POST", this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t)); else if (this.isNode()) { this.initGotEnv(t); const { url: s, ...i } = t; this.got.post(s, i).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) }) } } time(t, e = null) { const s = e ? new Date(e) : new Date; let i = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in i) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length))); return t } msg(e = t, s = "", i = "", r) { const o = t => { if (!t) return t; if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? { "open-url": t } : this.isSurge() ? { url: t } : void 0; if ("object" == typeof t) { if (this.isLoon()) { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } if (this.isQuanX()) { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl; return { "open-url": e, "media-url": s } } if (this.isSurge()) { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } } }; if (this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))), !this.isMuteLog) { let t = ["", "==============📣系统通知📣=============="]; t.push(e), s && t.push(s), i && t.push(i), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { const s = !this.isSurge() && !this.isQuanX() && !this.isLoon(); s ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t) } wait(t) { return new Promise(e => setTimeout(e, t)) } done(t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; this.log("", `🔔${this.name}, 结束! 🕛 ${s} 秒`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, e) }
