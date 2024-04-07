const ApiContracts = require("authorizenet").APIContracts;
const ApiControllers = require("authorizenet").APIControllers;

const cancelSubscription = (subscriptionId) => {
  const merchantAuthenticationType =
    new ApiContracts.MerchantAuthenticationType();
  merchantAuthenticationType.setName(process.env.AUTHORIZE_API_LOGIN_KEY);
  merchantAuthenticationType.setTransactionKey(
    process.env.AUTHORIZE_API_TRANSACTION_KEY,
  );

  const cancelRequest = new ApiContracts.ARBCancelSubscriptionRequest();
  cancelRequest.setMerchantAuthentication(merchantAuthenticationType);
  cancelRequest.setSubscriptionId(subscriptionId);

  console.log(JSON.stringify(cancelRequest.getJSON(), null, 2));

  const ctrl = new ApiControllers.ARBCancelSubscriptionController(
    cancelRequest.getJSON(),
  );

  ctrl.setEnvironment("https://api.authorize.net/xml/v1/request.api");

  return new Promise((resolve, reject) => {
    ctrl.execute(() => {
      const apiResponse = ctrl.getResponse();
      const response = new ApiContracts.ARBCancelSubscriptionResponse(
        apiResponse,
      );

      console.log(JSON.stringify(response, null, 2));

      if (response != null) {
        if (
          response.getMessages().getResultCode() ==
          ApiContracts.MessageTypeEnum.OK
        )
          resolve(response.getMessages().getMessage()[0].getText());
        else {
          reject(response.getMessages().getMessage()[0].getText());
        }
      } else {
        reject("Null response received");
      }
    });
  });
};

module.exports = cancelSubscription;
