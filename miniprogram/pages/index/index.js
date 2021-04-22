// miniprogram/pages/index.js
var bleData = ''
var bleStr = ''
var bleDataLength = 0
var isTraversing = false
var isFindDevice = false
const bleopen1 = 'AT+101W7=0600vv'
const bleopen2 = 'AT+102C7=0600vv'
const blestate = 'AT+051R5vv'
const blesoftv = 'AT+051R4vv'
const bleaaaa = 'aaaaaa'
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
    deviceqrid:''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var obj = wx.getLaunchOptionsSync()
    if(obj.query.deviceqrid != null){
      this.requestMac(obj.query.deviceqrid)
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

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
      url: getApp().globalData.host+'/api/getmac',
      data:{"deviceqrid":deviceqrid},
      success: (result) => {
        console.log(result.data)
        this.setData({
          blemac:result.data.mac,
          blename:result.data.blename
        })
        if(result.data.code == 20000){
          this.openBluetoothAdapter()
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
  openBluetoothAdapter() {
    wx.openBluetoothAdapter({
      success: (res) => {
        console.log('openBluetoothAdapter success', res)
        this.startBluetoothDevicesDiscovery()
      },
      fail: (res) => {
        if (res.errCode === 10001) {
          wx.onBluetoothAdapterStateChange(function (res) {
            console.log('onBluetoothAdapterStateChange', res)
            if (res.available) {
              this.startBluetoothDevicesDiscovery()
            }
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
          duration: 1000,
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
    const ds = this.data.device
    const deviceId = ds.deviceId
    const name = ds.name
    wx.createBLEConnection({
      deviceId,
      success: (res) => {
        this.setData({
          connected: true,
          name,
          deviceId,
        })
        this.getBLEDeviceServices(deviceId)
      },
      fail:(res)=>{
        wx.showToast({
          title: "连接设备失败",
          duration: 1000,
          icon: "error"
        })
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
          duration: 1000,
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
            this.formWriteData(bleaaaa)
            setTimeout(()=>{
                  this.formWriteData(blestate)
                }, 1000)
          }
          if (item.properties.notify || item.properties.indicate) {
            wx.notifyBLECharacteristicValueChange({
              deviceId,
              serviceId,
              characteristicId: item.uuid,
              state: true,
              success: (res) => {
                console.log('开启notify成功' + this._characteristicId)
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
      var temp = hexCharCodeToStr(data)
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
    var d = hexCharCodeToStr(data)
    console.log("蓝牙接收组装完成数据",d)
    console.log("蓝牙接收组装完成数据去除校验位",d.substring(0,d.length-2))
    var backdata = d.substring(0,d.length-2)
    if(backdata.search('AT\\+102B7') != -1){
      this.formWriteData(bleopen2)
    }else if(backdata.search('AT\\+102C7') != -1){
      //设备启动
    }else if(backdata.search('AT\\+[0-9]{2}2A5') != -1){
      //设备状态 AT+232A5=02.0V000%Link+000
      this.parseState(backdata)
    }
  },
  parseState(backdata){
      console.log("电量",backdata.substr(14,3))
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
  writeBLECharacteristicValue(sendData){
    var buffer = str2ab(sendData)
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
                    console.log("蓝牙接收数据",characteristic.value.byteLength ,ab2hex(characteristic.value))
                    if (characteristic.value.byteLength > 0) {
                      this.formdBLEData(ab2hex(characteristic.value))
                    }
                  })
                }
              })
            }
        })
  },
})

function str2ab(str) {
  // var data = [0x41, 0x54, 0x2b,0x30,0x36,0x31,0x52,0x31,0x3d,0x0d,0x0a];
  var buf = new ArrayBuffer(str.length);
  var dataView = new DataView(buf);
  var strs = str.split("");
  var i = 0;
  for (i; i < strs.length; i++) {
    dataView.setUint8(i, strs[i].charCodeAt());
  }
  console.log(buf)
  return buf
}

// ArrayBuffer转16进度字符串示例
function ab2hex(buffer) {
  var hexArr = Array.prototype.map.call(
    new Uint8Array(buffer),
    function (bit) {
      return ('00' + bit.toString(16)).slice(-2)
    }
  )
  return hexArr.join('');
  // return String.fromCharCode.apply(null, new Uint16Array(buffer));
}

//十六进制转ASCII码
function hexCharCodeToStr(hexCharCodeStr) {
  var trimedStr = hexCharCodeStr.trim();
  var rawStr = trimedStr.substr(0, 2).toLowerCase() === "0x" ? trimedStr.substr(2) : trimedStr;
  var len = rawStr.length;
  if (len % 2 !== 0) {
    alert("存在非法字符!");
    return "";
  }
  var curCharCode;
  var resultStr = [];
  for (var i = 0; i < len; i = i + 2) {
    curCharCode = parseInt(rawStr.substr(i, 2), 16);
    resultStr.push(String.fromCharCode(curCharCode));
  }
  return resultStr.join("");
}