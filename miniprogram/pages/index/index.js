// miniprogram/pages/index.js
//deviceqrid=01:00:25:12:20:20
//deviceqrid=00:08:05:54:80:05
// 56:80:c7:f8:74:11
const moment = require('../util/moment.min');
const blue = require('../util/Bluetooth');
const app = getApp()


var bleData = ''
var bleStr = ''
var bleDataLength = 0
var isTraversing = false
var isFindDevice = false
const bleopen1 = 'AT+101W7=1800vv'
const bleopen2 = 'AT+102C7=1800vv'
const blestate = 'AT+051R5vv'
const blesoftv = 'AT+051R4vv'
const bletime = 'AT+051R8vv'
const bleactive = 'AT+061WS1vv'
var ishowads = true
var isConnect = false

Page({

  /**
   * 页面的初始数据
   */
  data: {
    device: {},
    connected: false,
    chs: [],
    blemac:'',
    blename:'',
    deviceqrid:'',
    deviceinfo:{},
    isShowHotelpay :false,
    isShowWxpay:false,
    payview:false,
    sureview:false,
    timeview:false,
    orderid:"",
    lefttime:0,
    plan:0,
    isfirst:false,
    realprice:0,
    discountTicket:{},
    sellTicket:{},
    modalHidden: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // var obj = wx.getLaunchOptionsSync()
    // console.log(obj)
    // this.requestMac(options)
    this.setData({
      ishowads: true
    })
    setTimeout(()=>{
      this.setData({
        ishowads: false
      })
    }, 3000)

    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        if(res.code){
          wx.request({
            url: app.globalData.host+'/api/wxlogin',
            data: {
              code: res.code
            },
            success: (result) => {
              console.log('wxlogin',result.data)
              app.globalData.openid = result.data.openid
              app.globalData.unionid = result.data.unionid
              if(options.q !=null){
                var url = decodeURIComponent(options.q)
                var deviceqrid= url.substring(url.indexOf('deviceqrid=')+11)
                if(deviceqrid!=null){
                  this.requestMac(deviceqrid)
                }
              }else{
                this.requestMac(options.deviceqrid)
                // this.jump()
              }
            }
          })
        }
      }
    }),
    
    setInterval(()=> {
      if(this.data.lefttime != 0){
        var t = moment(this.data.lefttime,'HH:mm:ss').valueOf()
        this.setData({lefttime:moment(t-1000).format('HH:mm:ss')})
      }
   }, 1000);
    
  // this.setData({payview:false,sureview:false,timeview:true,openview:false})
    
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    this.jump()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
     bleData = ''
     bleStr = ''
     bleDataLength = 0
     isTraversing = false
     isFindDevice = false
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    this.closeBLEConnection()
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  scanCode(){
    wx.scanCode({
      onlyFromCamera: true,
      success: (res)=> {
        var result = unescape(res.result)
        var deviceqrid = result.substring(result.indexOf('deviceqrid=')+11)
        console.log(deviceqrid)
        this.requestMac(deviceqrid)
      }
    })
  },
  requestMac(deviceqrid){
    console.log("requestMac",deviceqrid)
    wx.request({
      url: app.globalData.host+'/api/getmac',
      data:{"deviceqrid":deviceqrid},
      success: (result) => {
        console.log('requestMac',result.data)
        this.setData({
          blemac:result.data.mac,
          blename:result.data.blename
        })
        if(result.data.code == 20000){
          // this.openBluetoothAdapter()
          this.requestDeviceInfo(this.data.blemac)
        }else{
          wx.showToast({
            title: "未找到mac地址",
            duration: 1000,
            icon: "error"
          })
        }
      },
      fail:(res)=>{
        wx.showToast({
          title: "请求接口失败",
          duration: 1000,
          icon: "error"
        })
      }
    })
  },
  requestDeviceInfo(id){
    wx.request({
      url: app.globalData.host+'/api/device/info',
      data:{"id":id},
      success: (result) => {
        console.log('requestDeviceInfo',result.data)
        // this.setData({
        //   blemac:result.data.mac,
        //   blename:result.data.blename
        // })
        if(result.data.code == 20000){
          this.setData({
            deviceinfo:result.data,
            realprice:result.data.Hotel.price
          })
          // if(this.data.deviceinfo.Hotel.payway == "hotelpay"){
            this.checkOrder()
          // }else{
          //   this.checkWxOrder()
          // }
          this.openBluetoothAdapter()
        }else{
          wx.showToast({
            title: "未找到改设备信息",
            duration: 1000,
            icon: "error"
          })
        }
      },
      fail:(res)=>{
        wx.showToast({
          title: "请求接口失败",
          duration: 1000,
          icon: "error"
        })
      }
    })
  },
  checkWxOrder(){
    var mac  = this.data.blemac
    console.log("checkWxOrder",mac,app.globalData.openid)
    wx.request({
      url: app.globalData.host+'/api/order/checkwx',
      data:{"deviceid":mac,"playerid":app.globalData.openid},
      success: (result) => {
        console.log('checkWxOrder',result.data)
        if(result.data.code == 20000){
          this.setData({payview:false,sureview:true,timeview:false,openview:false,orderid:result.data.order.id})
          // this.setData({payview:false,sureview:false,timeview:true,hotelorder:result.data.order})
          // (1000*60*60*24)-
          var a = moment().valueOf()
          var b = moment(result.data.order.created_at,"YYYY-MM-DD HH:mm:ss").valueOf()
          var c = moment.duration((1000*60*60*24)-(a-b),'milliseconds')
          this.setData({lefttime:c.hours()+":"+c.minutes()+":"+c.seconds()})
          // this.requestDeviceInfo(this.data.blemac)
        }else{
          if(result.data.code == 20001){
            this.setData({isfirst:result.data.first,realprice:this.data.realprice*0.5})
          }else{
            this.setData({isfirst:false,realprice:this.data.realprice-10})
          }
          this.setData({payview:true,sureview:false,timeview:false,openview:false})
          if(this.data.deviceinfo.Hotel.payway == "hotelpay"){
            this.setData({isShowHotelpay:true,isShowWxpay:false})
          }else{
            this.setData({isShowHotelpay:false,isShowWxpay:true})
          }
        }
      },
      fail:(res)=>{
        wx.showToast({
          title: "请求接口失败",
          duration: 1000,
          icon: "error"
        })
      },
      complete:(result) => {},

    })
  },
  checkOrder(){
    var mac  = this.data.blemac
    console.log("checkOrder",mac,app.globalData.openid)
    wx.request({
      url: app.globalData.host+'/api/order/check',
      data:{"deviceid":mac,"playerid":app.globalData.openid},
      success: (result) => {
        console.log('checkorder',result.data)
        if(result.data.code == 20000){
          this.setData({payview:false,sureview:true,timeview:false,openview:false,orderid:result.data.order.id})
          wx.request({
            url: 'https://s.anane.cn/api/xcx/index.aspx?opt=getShoppingCoupon',
            data:{"unionid":app.globalData.unionid},
            success: (result) => {
              console.log('getShoppingCoupon',result.data)
              this.setData({discountTicket:result.data[0],sellTicket:result.data[1]})
            },
            fail:(res)=>{
            }})
          // this.setData({payview:false,sureview:false,timeview:true,hotelorder:result.data.order})
          // (1000*60*60*24)-
          var a = moment().valueOf()
          var b = moment(result.data.order.created_at,"YYYY-MM-DD HH:mm:ss").valueOf()
          var c = moment.duration((1000*60*60*24)-(a-b),'milliseconds')
          this.setData({lefttime:c.hours()+":"+c.minutes()+":"+c.seconds()})
          // this.requestDeviceInfo(this.data.blemac)
        }else{
          if(result.data.code == 20001){
            this.setData({isfirst:result.data.first,realprice:this.data.realprice*0.5})
          }else{
            this.setData({isfirst:false,realprice:this.data.realprice-10})
          }
          this.setData({payview:true,sureview:false,timeview:false,openview:false})
          if(this.data.deviceinfo.Hotel.payway == "hotelpay"){
            this.setData({isShowHotelpay:true,isShowWxpay:false})
          }else{
            this.setData({isShowHotelpay:false,isShowWxpay:true})
          }
        }
      },
      fail:(res)=>{
        wx.showToast({
          title: "请求接口失败",
          duration: 1000,
          icon: "error"
        })
      },
      complete:(result) => {},

    })
  },
  requestOrder(){
    if(!isConnect){
      wx.showToast({
        title: "连接设备失败,请检查手机蓝牙",
        duration: 2000,
        icon: "error"
      })
      return
    }
    wx.showLoading()
    var mac  = this.data.blemac
    console.log("requestOrder",mac)
    wx.request({
      url: app.globalData.host+'/api/order/create',
      data:{"deviceid":mac,"playerid":app.globalData.openid,"realprice":this.data.realprice},
      success: (result) => {
        wx.request({
          url: 'https://s.anane.cn/api/xcx/index.aspx?opt=addUserCoupon',
          data:{"unionid":app.globalData.unionid,"hotelCode":this.data.deviceinfo.Hotel.id,"hotelName":this.data.deviceinfo.Hotel.name,"shareratio":this.data.deviceinfo.Hotel.selldivide}})
        console.log('requestOrder',result.data)
        if(result.data.code == 20000){
          this.setData({payview:false,sureview:true,timeview:false,openview:false,orderid:result.data.order.id})
          // this.setData({payview:false,sureview:false,timeview:true,hotelorder:result.data.order})
          // (1000*60*60*24)-
          var a = moment().valueOf()
          var b = moment().valueOf()
          // var b = moment(result.data.order.created_at,"YYYY-MM-DD HH:mm:ss").valueOf()
          var c = moment.duration((1000*60*60*24)-(a-b),'milliseconds')
          this.setData({lefttime:c.hours()+":"+c.minutes()+":"+c.seconds()})
          // this.requestDeviceInfo(this.data.blemac)
        }else{
        }
      },
      fail:(res)=>{
        wx.showToast({
          title: "请求接口失败",
          duration: 1000,
          icon: "error"
        })
      },
      complete:(result) => {wx.hideLoading()},

    })
  },
  openBluetoothAdapter() {
    
    wx.openBluetoothAdapter({
      success: (res) => {
        console.log('openBluetoothAdapter success', res)
        this.startBluetoothDevicesDiscovery()
        
      },
      fail: (res) => {
        console.log('onBluetoothAdapterStateChange error',res.errCode )
        if (res.errCode === 10001) {
          wx.showToast({
            title: "请打开蓝牙",
            duration: 2000,
            icon: "error"
          })
          wx.onBluetoothAdapterStateChange( (res) =>{
            console.log('onBluetoothAdapterStateChange', res)
            if (res.available) {
              this.startBluetoothDevicesDiscovery()
            }
          })
        }else{
          wx.showToast({
            title: "请打开蓝牙",
            duration: 2000,
            icon: "error"
          })
        }
      }
    })
  },
  getBluetoothAdapterState() {
    wx.getBluetoothAdapterState({
      success: (res) => {
        console.log('getBluetoothAdapterState', res)
        if (res.discovering) {
          this.onBluetoothDeviceFound()
        } else if (res.available) {
          this.startBluetoothDevicesDiscovery()
        }
      },
      fail:(res)=>{
        wx.showToast({
          title: "请打开蓝牙",
          duration: 2000,
          icon: "error"
        })
      }
    })
  },
  startBluetoothDevicesDiscovery() {
    if (this._discoveryStarted) {
      return
    }
    this._discoveryStarted = true
    wx.startBluetoothDevicesDiscovery({
      allowDuplicatesKey: true,
      success: (res) => {
        console.log('startBluetoothDevicesDiscovery success', res)
        this.onBluetoothDeviceFound()
      },
    })
  },
  onBluetoothDeviceFound() {
    wx.onBluetoothDeviceFound((res) => {
      this.traverseDevices(res)
    })
  },
  traverseDevices(res){
    console.log("traverseDevices",isTraversing)
    if(isTraversing == false && isFindDevice==false){
      isTraversing = true
      for(let i in res.devices){
        var d = res.devices[i]
        if(d.name == this.data.blename){
          isFindDevice = true
          console.log('通过设备名称找到设备')
          this.setData({
              device:d
            }
          )
          this.createBLEConnection()
          break;
        }
      }
    }
    isTraversing = false
  },
  closeBLEConnection() {
    wx.closeBLEConnection({
      deviceId: this.data.deviceId
    })
    this.setData({
      connected: false,
      chs: [],
      canWrite: false,
    })
  },
  createBLEConnection() {
    console.log("createBLEConnection")
    const ds = this.data.device
    const deviceId = ds.deviceId
    const name = ds.name
    wx.createBLEConnection({
      deviceId,
      success: (res) => {
        this.setData({
          connected: true
        })
        isConnect = true
        this.getBLEDeviceServices(deviceId)
      },
      fail:(res)=>{
        // wx.showToast({
        //   title: "连接设备失败",
        //   duration: 1000,
        //   icon: "error"
        // })
        this.createBLEConnection()
      }
    })
    this.stopBluetoothDevicesDiscovery()
  },
  stopBluetoothDevicesDiscovery() {
    wx.stopBluetoothDevicesDiscovery()
  },
  getBLEDeviceServices(deviceId) {
    wx.getBLEDeviceServices({
      deviceId,
      success: (res) => {
        console.log("getBLEDeviceServices", res.services)
        this.getBLEDeviceCharacteristics(deviceId, 'EFCDAB89-6745-2301-EFCD-AB8967452301')
      },
      fail:(res)=>{
        wx.showToast({
          title: "获取服务失败",
          duration: 2000,
          icon: "error"
        })
      },
    })
  },
  getBLEDeviceCharacteristics(deviceId, serviceId) {
    wx.getBLEDeviceCharacteristics({
      deviceId,
      serviceId,
      success: (res) => {
        this.setData({
          connected: true
        })
        console.log('getBLEDeviceCharacteristics success', res.characteristics)
        for (let i = 0; i < res.characteristics.length; i++) {
          let item = res.characteristics[i]
          if (item.properties.read) {
            wx.readBLECharacteristicValue({
              deviceId,
              serviceId,
              characteristicId: item.uuid,
            })
          }
          if (item.properties.write) {
            this.setData({
              canWrite: true
            })
            this._deviceId = deviceId
            this._serviceId = serviceId
            this._characteristicId = item.uuid
            
          }
          if (item.properties.notify || item.properties.indicate) {
            wx.notifyBLECharacteristicValueChange({
              deviceId,
              serviceId,
              characteristicId: item.uuid,
              state: true,
              success: (res) => {
                console.log('开启notify成功' + this._characteristicId)
                this.formWriteData(bleactive)
                setInterval(()=> {
                  var buffer = blue.str2ab(bleactive)
                  wx.writeBLECharacteristicValue({
                      deviceId: this._deviceId,
                      serviceId: this._serviceId,
                      characteristicId: this._characteristicId,
                      value: buffer
                  })

               }, 2000);
                setTimeout(()=>{
                  this.formWriteData(blestate)
                }, 1000)
              }
            })
          }
        }
      },
      fail(res) {
        console.error('getBLEDeviceCharacteristics', res)
      }
    })
  },
  formdBLEData(data) {
    if (data.search('41542b') != -1) {
      bleDataLength = 0
      bleData = data
      var temp = blue.hexCharCodeToStr(data)
      bleDataLength = parseInt(temp.substr(3,2))
      if(bleData.length==bleDataLength*2+10){
        this.processBLEData(bleData)
      }
      console.log("蓝牙数据长度：",bleDataLength)
    } else {
      bleData = bleData.concat(data)
      if(bleData.length==bleDataLength*2+10){
        this.processBLEData(bleData)
      }
    }
  },
  //////////////
  processBLEData(data) {
    var d = blue.hexCharCodeToStr(data)
    console.log("蓝牙接收组装完成数据",d)
    console.log("蓝牙接收组装完成数据去除校验位",d.substring(0,d.length-2))
    var backdata = d.substring(0,d.length-2)
    if(backdata.search('AT\\+102B7') != -1){
      this.setData({payview:false,sureview:false,timeview:false,openview:true})
      this.setData({
        plan:50
      })
      this.formWriteData(bleopen2)
    }else if(backdata.search('AT\\+102C7') != -1){
      this.setData({
        plan:100
      })
      this.getTime()
      this.setData({payview:false,sureview:false,timeview:true,openview:false})
      wx.request({
        url: 'https://s.anane.cn/api/xcx/index.aspx?opt=getShoppingCoupon',
        data:{"unionid":app.globalData.unionid},
        success: (result) => {
          console.log('getShoppingCoupon',result.data)
          this.setData({discountTicket:result.data[0],sellTicket:result.data[1]})
        },
        fail:(res)=>{
        }})
      //设备启动
      // this.requestOrder(this.data.blemac)
    }else if(backdata.search('AT\\+[0-9]{2}2A5') != -1){
      //设备状态 AT+232A5=02.0V000%Link+000
      this.parseState(backdata)
    }else if(backdata.search('AT\\+[0-9]{2}2A8') != -1){
      
      //设备上次使用时长
      this.parseTime(backdata)
    }
  },
  parseState(backdata){
      console.log("电量",parseInt(backdata.substr(14,3)))
      if(parseInt(backdata.substr(14,3))<40){
        //上报低电量
      }
  },
  parseTime(backdata){
    let t = backdata.substr(9,4)
    console.log("时间",t)
    //上报上次使用时长
    // if(parseInt(t)<=0){
    //   return
    // }
    wx.request({
      url: app.globalData.host+'/api/order/updatelastrecord',
      data:{"did":this.data.blemac,
      "content":parseInt(t)
      },
      success: (result) => {
        console.log('updatelastrecord',result.data)
      },
      fail:(res)=>{
      },
      complete:(r)=>{
        wx.request({
          url: app.globalData.host+'/api/order/createrecord',
          data:{"deviceid":this.data.blemac,"playerid":app.globalData.openid,"orderid":this.data.orderid},
          success: (result) => {
            console.log('createrecord',result.data)
          },
          fail:(res)=>{
          }
        })
      }
    })
  },
  getTime(){
    this.formWriteData(bletime)
  },
  open(){
    this.formWriteData(bleopen1)
  },
  state(){
    this.formWriteData(blestate)
  },
  softv(){
    this.formWriteData(blesoftv)
  },
  shop(){
    this.formWriteData(blesoftv)
  },
  wxpay(){
    if(!isConnect){
      wx.showToast({
        title: "连接设备失败,请检查手机蓝牙",
        duration: 2000,
        icon: "error"
      })
      return
    }
    wx.showLoading()
    wx.request({
      url: app.globalData.host+'/api/order/wxpay',
      data:{"openid":app.globalData.openid,"attach":this.data.blemac,"realprice":this.data.realprice},
      success: (result) => {
        wx.request({
          url: 'https://s.anane.cn/api/xcx/index.aspx?opt=addUserCoupon',
          data:{"unionid":app.globalData.unionid,"hotelCode":this.data.deviceinfo.Hotel.id,"hotelName":this.data.deviceinfo.Hotel.name,"shareratio":this.data.deviceinfo.Hotel.selldivide}})
        console.log('wxpay',result.data)
        var out_trade_no = result.data.out_trade_no
        wx.showLoading()
        wx.requestPayment({
          nonceStr: result.data.nonceStr,
          package: result.data.package,
          paySign: result.data.paySign,
          timeStamp: result.data.timeStamp,
          signType: "MD5",
          success:(result) => {
          this.setData({payview:false,sureview:true,timeview:false,openview:false,orderid:out_trade_no})
          var a = moment().valueOf()
          var b = moment().valueOf()
          // var b = moment(result.data.order.created_at,"YYYY-MM-DD HH:mm:ss").valueOf()
          var c = moment.duration((1000*60*60*24)-(a-b),'milliseconds')
          this.setData({lefttime:c.hours()+":"+c.minutes()+":"+c.seconds()})
            // 
          },
          fail:(result) => {console.log(result)},
          complete:(result) => {wx.hideLoading()},
        })
        
      },
      fail:(res)=>{
      }
    })
  },
  /////////////////
  formWriteData(command) {
    console.log("写入数据",command,command.length)
    if(command.length>20){
      var count  = Math.ceil(command.length/20)
      for(var i =0;i<count;i++){
        var sendData = command.slice(20*i,20*(i+1))
        console.log("写入分组数据",sendData)
        this.writeBLECharacteristicValue(sendData)
      }
    }else{
      this.writeBLECharacteristicValue(command)
    }
  },
  jump(){
    wx.navigateToMiniProgram({
      appId: "wxf60f683022f39bca",
    })
  },
  writeBLECharacteristicValue(sendData){
    var buffer = blue.str2ab(sendData)
        wx.writeBLECharacteristicValue({
            deviceId: this._deviceId,
            serviceId: this._serviceId,
            characteristicId: this._characteristicId,
            value: buffer,
            success: (res) =>{
              console.log("!!!!!write成功")
              wx.readBLECharacteristicValue({
                deviceId: this._deviceId,
                serviceId: this._serviceId,
                characteristicId: this._characteristicId,
                success: (res) => {
                  console.log('读取数据成功')
                  // 操作之前先监听，保证第一时间获取数据
                  wx.onBLECharacteristicValueChange((characteristic) => {
                    console.log("蓝牙接收数据",characteristic.value.byteLength ,blue.ab2hex(characteristic.value))
                    if (characteristic.value.byteLength > 0) {
                      this.formdBLEData(blue.ab2hex(characteristic.value))
                    }
                  })
                }
              })
            }
        })
  }
})

