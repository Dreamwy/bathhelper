// miniprogram/pages/produce.js
var bleData = ''
var bleStr = ''
var bleDataLength = 0
const blue = require('../util/Bluetooth');

const blemac = 'AT+051R1vv'
const blename = 'AT+051R9vv'
const blesuccess = 'AT+71A1=1vv'
const blefail = 'AT+71A1=0vv'
const bleactive = 'AT+061WS1vv'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    mac:'',
    blename:'',
    code:'',
    deviceid:'',
    devices: [],
    connected: false,
    chs: [],
    printdata:'',
    writemac:'',
    writename:''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

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
    console.log('onShow监听页面显示');
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    // this.closeBLEConnection()
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

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
        //www.anane.net.cn/api/wxqr?deviceqrid=01:00:25:12:20:20
        var deviceqrid = result.substr(result.indexOf('deviceqrid=')+11,17)
        console.log(deviceqrid)
        wx.request({
          url: getApp().globalData.host+'/api/createmac',
          data:{"deviceqrid":deviceqrid,"mac":this.data.mac,"blename":this.data.blename},
          success: (result) => {
            if(result.data.code == 20000){
              this.setData({
                printdata:"mac:"+this.data.mac+"二维码:"+this.data.deviceqrid+"蓝牙名称:"+this.data.blename+"\n",
                writemac:this.data.mac,
                writename:this.data.blename
              })
              this.formWriteData(blesuccess)
            }else{
              this.formWriteData(blefail)
            }
            
            
          }
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
  stopBluetoothDevicesDiscovery() {
    wx.stopBluetoothDevicesDiscovery()
  },
  onBluetoothDeviceFound() {
    wx.onBluetoothDeviceFound((res) => {
      res.devices.forEach(device => {
        // if (device.deviceId != "DC:52:85:19:FF:CF") {
        //   return
        // }
        // if (!device.name && !device.localName) {
        //   return
        // }
        const foundDevices = this.data.devices
        const idx = inArray(foundDevices, 'deviceId', device.deviceId)
        const data = {}
        if (idx === -1) {
          data[`devices[${foundDevices.length}]`] = device
        } else {
          data[`devices[${idx}]`] = device
        }
        this.setData(data)
      })
    })
  },
  createBLEConnection(e) {
    const ds = e.currentTarget.dataset
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
      }
    })
    this.stopBluetoothDevicesDiscovery()
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
  getBLEDeviceServices(deviceId) {
    wx.getBLEDeviceServices({
      deviceId,
      success: (res) => {
        console.log("!!!!!", res.services)
        // this.getBLEDeviceCharacteristics(deviceId, '0000181C-0000-1000-8000-00805F9B34FB')
        this.getBLEDeviceCharacteristics(deviceId, 'EFCDAB89-6745-2301-EFCD-AB8967452301')
        // for (let i = 0; i < res.services.length; i++) {
        //   if (res.services[i].isPrimary) {
        //     this.getBLEDeviceCharacteristics(deviceId, res.services[i].uuid)
        //     return
        //   }
        // }
      }
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
            // this.writeBLECharacteristicValue()
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
                  this.formWriteData(bleactive)
               }, 2000);
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
  clickWriteData(event){
    var command = blemac
    switch (parseInt(event.currentTarget.dataset.command)) {
      case 1:
        command = blemac
        break;
      case 11:
        command = 'AT+181W1='+writemac.replace(':','')+'vv'
        break;
      case 2:
        command = 'AT+051R2vv'
        break;
      case 22:
        command = 'AT+081W2=aavv'
        break;
      case 5:
        command = 'AT+051R5vv'
        break;
      case 6:
        command = 'AT+071W6=1vv'
        break;
      case 9:
        command = blename
        break;
      case 99:
        command = 'AT+211W9=llllljjjjjooooovv'
        break;
      default:
        break;
    }
    this.formWriteData(command)
  },
  formWriteData(command) {
    this.setData({
      printdata:this.data.printdata+"发送:"+command+"\n"
    })
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
                    console.log("蓝牙接收数据",blue.ab2hex(characteristic.value))
                    if (characteristic.value.byteLength > 0) {
                      this.formdBLEData(blue.ab2hex(characteristic.value))
                    }
                  })
                }
              })
            }
        })
  },
  closeBluetoothAdapter() {
    wx.closeBluetoothAdapter()
    this._discoveryStarted = false
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
  processBLEData(data) {
    console.log("蓝牙接收组装完成数据",blue.hexCharCodeToStr(data))
    var backdata = blue.hexCharCodeToStr(data)
    this.setData({
      printdata:this.data.printdata+"收到:"+backdata+"\n"
    })
    if(backdata.search('AT\\+[0-9]{2}2C1') != -1){
      //串口 c1 读Mac 读 设备名
      this.formWriteData(blemac)
    }else if(backdata.search('AT\\+[0-9]{2}2A1') != -1){
      //MaC
      parseMac(backdata)
      this.formWriteData(blename)
    }else if(backdata.search('AT\\+[0-9]{2}2A9') != -1){
      //设备名称
      parseName(backdata)
      this.formWriteData(blesuccess)
      // this.formWriteData(blename)
    }else if(backdata.search('AT\\+[0-9]{2}2C2') != -1){
      //扫码
      this.scanCode()
    }
    //  else if(backdata.search('AT\\+[0-9]{2}2C3') != -1){

    // }
    
  },
  parseMac(backdata){
    let m = backdata.substr(9,10)
    this.setData({mac:m})
  },
  parseName(backdata){
    let l = backdata.substr(3,2)
    let n = backdata.substr(9,parseInt(l)-5)
    this.setData({blename:n})
  }
})
