// miniprogram/pages/produce.js
var bleData = ''
var bleStr = ''
var bleDataLength = 0
Page({

  /**
   * 页面的初始数据
   */
  data: {
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
        var deviceqrid = result.substring(result.indexOf('deviceqrid=')+11,result.lastIndexOf('#'))
        console.log(deviceqrid)
        wx.request({
          url: getApp().globalData.host+'/api/getmac',
          data:{"deviceqrid":deviceqrid},
          success: (result) => {
            this.setData({
              printdata:"mac:"+result.data.mac+"二维码:"+result.data.deviceqrid+"蓝牙名称:"+result.data.blename+"\n",
              writemac:result.data.mac,
              writename:result.data.blename
            })
            console.log(result.data)
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
    var command = 'AT+051R1vv'
    switch (parseInt(event.currentTarget.dataset.command)) {
      case 1:
        command = 'AT+051R1vv'
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
        command = 'AT+051R9vv'
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
                    console.log("蓝牙接收数据",ab2hex(characteristic.value))
                    if (characteristic.value.byteLength > 0) {
                      this.formdBLEData(ab2hex(characteristic.value))
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
      var temp = hexCharCodeToStr(data)
      bleDataLength = parseInt(temp.substr(3,2))
      console.log("蓝牙数据长度：",bleDataLength)
    } else {
      bleData = bleData.concat(data)
      if(bleData.length*2+6>=bleDataLength+10){
        this.processBLEData(bleData)
      }
    }
  },
  processBLEData(data) {
    console.log("蓝牙接收组装完成数据",hexCharCodeToStr(data))
    var backdata = hexCharCodeToStr(data)
    this.setData({
      printdata:this.data.printdata+"收到:"+backdata+"\n"
    })
    if(backdata.search('AT+182B1') != -1){
      this.formWriteData('AT+182C1='+writemac.replace(':','')+'vv')
    }
  }
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

function inArray(arr, key, val) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i][key] === val) {
      return i;
    }
  }
  return -1;
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