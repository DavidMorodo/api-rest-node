const CryptoJS = require('crypto-js');
// Code goes here
var keySize = 256;
var ivSize = 128;
var iterations = 50;



exports.cifrar = function (msg, pass) {
  var salt = CryptoJS.lib.WordArray.random(128/8);
  //console.log(salt);
  var key = CryptoJS.PBKDF2(pass, salt, {
      keySize: keySize/32,
      iterations: iterations
    });

  var iv = CryptoJS.lib.WordArray.random(128/8);
  
  var encrypted = CryptoJS.AES.encrypt(msg, key, { 
    iv: iv, 
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC
    
  });
  
  // salt, iv will be hex 32 in length
  // append them to the ciphertext for use  in decryption
  var transitmessage = salt.toString()+ iv.toString() + encrypted.toString();
  //console.log(transitmessage);
  return transitmessage;
}

exports.descifrar = function (transitmessage, pass) {
  //console.log("TRANSIT M: "+transitmessage);
  var salt = CryptoJS.enc.Hex.parse(transitmessage.substr(0, 32));
  var iv = CryptoJS.enc.Hex.parse(transitmessage.substr(32, 32));
  var encrypted = transitmessage.substring(64);
  
  var key = CryptoJS.PBKDF2(pass, salt, {
      keySize: keySize/32,
      iterations: iterations
    });
  //console.log("LA KEY: " + key);
  var decrypted = CryptoJS.AES.decrypt(encrypted, key, { 
    iv: iv, 
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC
    
  });

  //console.log("LA l: "+decrypted);
  var r = decrypted;
  //console.log("R: "+r.toString(CryptoJS.enc.Utf8));
  return r.toString(CryptoJS.enc.Utf8);
}