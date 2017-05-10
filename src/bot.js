const Bot = require('./lib/Bot')
const SOFA = require('sofa-js')
const Fiat = require('./lib/Fiat')
const request = require('request');

let bot = new Bot()

// ROUTING

bot.onEvent = function(session, message) {
  switch (message.type) {
    case 'Init':
      welcome(session)
      break
    case 'Message':
      onMessage(session, message)
      break
    case 'Command':
      onCommand(session, message)
      break
    case 'Payment':
      onPayment(session)
      break
    case 'PaymentRequest':
      welcome(session)
      break
  }
}

function onMessage(session, message) {
  const isTradeInProgress = (session.get('tradeInProgress') || false)
  if(isTradeInProgress) {
    console.log('TRADE IS IN PROGRESS MESSAGE');
    processTradeParameters(session, message);
  } else {
    welcome(session)
  }
}

function onCommand(session, command) {
  switch (command.content.value) {
    case 'newTrade': 
      startTrade(session);
      break;
    case 'cancelTrade':
      cancelTrade(session);
      break;
    case 'acceptTrade':
      acceptTrade(session);
      break;
    case 'rejectTrade':
      rejectTrade(session);
      break;
    case 'testDM':
      testDM(session);
      break;
    }
}

function onPayment(session) {
  sendMessage(session, `Thanks for the payment! 🙏`)
}

// STATES

function welcome(session) {
  getUserName(session.address, function(userName) {
    sendDefaultMessage(session, `Hello ${userName}!`)
  });
}

function incorrectParameters(session) {
  sendRequestTradeParameters(session, `Incorrect parameters.
  Please enter the following trade details in a single message separated by comma:
  username of trader (no @),
  name of product to trade,
  amount of product to trade,
  amount of US dollars to trade for`);
}

function startTrade(session) {
  session.set('tradeInProgress', true);
  sendRequestTradeParameters(session, `Please enter the following trade details in a single message separated by comma:
  username of trader (no @),
  name of product to trade,
  amount of product to trade,
  amount of US dollars to trade for`);
}

function cancelTrade(session) {
  session.set('tradeInProgress', false);  
  sendDefaultMessage(session, `Trade canceled`);
}

function acceptTrade(session) {
  session.set('tradeInProgress', false);
  const message = 'Trade accepted, adding to smart contract and forwarding to back office';
  sendDefaultMessage(session, message);
  const traderAddress = session.get('tradeStartedBy');
  sendDefaultDMMessage(traderAddress, message);
}

function rejectTrade(session) {
  session.set('tradeInProgress', false);  
  sendDefaultMessage(session, `Trade rejected`);
  const traderAddress = session.get('tradeStartedBy');
  sendDefaultDMMessage(traderAddress, 'Trade rejected');
}

function processTradeParameters(session, message) {
  //sendDefaultMessage(session, message);
  const parameters = message.body.split(',');
  console.log('PARAMETERS', parameters);  
  if(parameters.length == 4) {
    getUserAddress(parameters[0], function(userAddress) {
      console.log('USER ADDRESS FOUND', userAddress);
      session.set('tradeStartedBy', session.address);
      sendRequestTradeConfirmation(userAddress, `${parameters[0]} requested a trade of${parameters[2]} units of${parameters[1]} for${parameters[3]} dollars. Please accept or reject.`, session)
    });
  }
  else {
    welcome(session);
  }
}



// UTILITY

function getUserAddress(username, callback) {
  request(`https://identity.service.tokenbrowser.com/v1/user/${username}`, (error, response, body) => {
    console.log
    const userInfo = JSON.parse(body);
    callback(userInfo. token_id);
  });
}

function getUserName(address, callback) {
  request(`https://identity.service.tokenbrowser.com/v1/user/${address}`, (error, response, body) => {
    const userInfo = JSON.parse(body);
    console.log('USERINFO', userInfo);
    console.log(userInfo.username);
    callback(userInfo.username);
  });
}

// HELPERS

function sendDefaultMessage(session, message) {
  let controls = [
    {type: 'button', label: 'Create new trade', value: 'newTrade'},
  ]
  session.reply(SOFA.Message({
    body: message,
    controls: controls,
    showKeyboard: false,
  }))
}

function sendDefaultDMMessage(address, message) {
  let controls = [
    {type: 'button', label: 'Create new trade', value: 'newTrade'},
  ]
  bot.client.send(address, SOFA.Message({
    body: message,
    controls: controls,
    showKeyboard: false,
  }))
}

function sendRequestTradeParameters(session, message) {
  let controls = [
    {type: 'button', label: 'Cancel', value: 'cancelTrade'},
  ]
  session.reply(SOFA.Message({
    body: message,
    controls: controls,
    showKeyboard: false,
  }))
}

// Request trade confirmation from trader B
function sendRequestTradeConfirmation(address, message, session) {
  if(address === undefined) {
    sendDefaultMessage(session, 'hi');
    return;
  }
  
  let controls = [
    {type: 'button', label: 'Accept', value: 'acceptTrade'},
    {type: 'button', label: 'Reject', value: 'rejectTrade'},
  ]
  bot.client.send(address, SOFA.Message({
    body: message,
    controls: controls,
    showKeyboard: false,
  }))
}

function sendTradeMessage(session, message) {
  let controls = [
    {type: 'button', label: 'Accept', value: 'accept'},
    {type: 'button', label: 'Reject', value: 'reject'},
  ]
  session.reply(SOFA.Message({
    body: message,
    controls: controls,
    showKeyboard: false,
  }))
}

//OLD
/*

function sendMessage(session, message) {
  let controls = [
    {type: 'button', label: 'Ping', value: 'ping'},
    {type: 'button', label: 'Count', value: 'count'},
    {type: 'button', label: 'Donate', value: 'donate'}
  ]
  session.reply(SOFA.Message({
    body: message,
    controls: controls,
    showKeyboard: false,
  }))
}

function pong(session) {
  sendTradeMessage(session, `Pong`)
}

// example of how to store state on each user
function count(session) {
  let count = (session.get('count') || 0) + 1
  session.set('count', count)
  sendMessage(session, `${count}`)
}

function donate(session) {
  // request $1 USD at current exchange rates
  Fiat.fetch().then((toEth) => {
    session.requestEth(toEth.USD(1))
  })
}
*/