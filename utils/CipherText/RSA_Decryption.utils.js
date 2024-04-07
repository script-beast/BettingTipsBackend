const JSEncrypt = require("node-jsencrypt");

const RSA_Decryption = (encryptedData) => {
  var decrypt = new JSEncrypt();
  decrypt.setPrivateKey(process.env.PRIVATE_RSA_KEY);
  var uncrypted = decrypt.decrypt(encryptedData);
  return uncrypted;
};

module.exports = RSA_Decryption;
