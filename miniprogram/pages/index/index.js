// miniprogram/pages/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {

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
  }
})