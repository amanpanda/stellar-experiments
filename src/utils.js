import _ from 'lodash';
import StellarSdk from 'stellar-sdk';
import fetch from 'node-fetch';

const server = new StellarSdk.Server("https://horizon-testnet.stellar.org");
var transaction;

export const createSinks = async (n) => {
  return await Promise.all(_.map(_.range(n), async () => {
    const pair = StellarSdk.Keypair.random();
    try {
      const response = await fetch(
        `https://friendbot.stellar.org?addr=${encodeURIComponent(
          pair.publicKey(),
        )}`,
      );
      const responseJSON = await response.json();
      console.log("Created a sink account. \n");
      return {
        publicKey: pair.publicKey(),
        secret: pair.secret(),
        accountId: responseJSON.source_account,
      };
    } catch (e) {
      console.error("ERROR!", e);
    }
  }));
};

export const createSource = async () => {
  return new Promise(async (resolve, reject) => {
    const pair = StellarSdk.Keypair.random();
    try {
      const response = await fetch(
        `https://friendbot.stellar.org?addr=${encodeURIComponent(
          pair.publicKey(),
        )}`,
      );
      const responseJSON = await response.json();
      console.log("Created a source account\n");
      resolve({
        publicKey: pair.publicKey(),
        secret: pair.secret(),
        accountId: responseJSON.source_account,
      });
    } catch (e) {
      console.error("ERROR!", e);
      reject();
    }
  });
};

export const sendPayment = async ({
  source,
  destination,
}) => {
  const sourceSecretKey = source.secret;
  const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSecretKey);
  const sourcePublicKey = sourceKeypair.publicKey();
  const receiverPublicKey = destination.publicKey;
  // StellarSdk.Networks.useTestNetwork();

  const account = await server.loadAccount(sourcePublicKey);
  const fee = await server.fetchBaseFee();

  const transaction = new StellarSdk.TransactionBuilder(account, { 
    fee: StellarSdk.BASE_FEE*10,
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
  .addOperation(StellarSdk.Operation.payment({
    destination: receiverPublicKey,
    asset: StellarSdk.Asset.native(),
    amount: '1',
  }))
  .setTimeout(30)
  .build();

  transaction.sign(sourceKeypair);

  try {
    const transactionResult = await server.submitTransaction(transaction);
    console.log(JSON.stringify(transactionResult, null, 2));
    console.log('\nSuccess! View the transaction at: ');
    console.log(transactionResult._links.transaction.href);
  } catch (e) {
    console.log('An error has occured:');
    // console.log("Data: ", _.get(e, 'response.data'));
    console.log("Attempting again: ");
    return await sendPayment({ source, destination });
    // console.log(e);
  }
}
