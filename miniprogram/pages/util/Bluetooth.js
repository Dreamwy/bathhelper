
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

export{str2ab,hexCharCodeToStr,ab2hex}
