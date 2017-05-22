var restify = require('restify');
var builder = require('botbuilder');
//const bot = require('./bot.js');
// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
/*var bot = new builder.UniversalBot(connector, function (session) {
    session.send("You said: %s", session.message.text);
	
});*/

var bot = new builder.UniversalBot(connector, [
    (session, args, next) => {

        const card = new builder.ThumbnailCard(session);
        card.buttons([
            new builder.CardAction(session).title('Add a number').value('Add').type('imBack'),
            new builder.CardAction(session).title('Get help').value('help').type('imBack'),
        ]).text(`What would you like to do?`);
        
        const message = new builder.Message(session);
        message.addAttachment(card);

        session.send(`Hi there! I'm the calculator bot! I can add numbers for you.`);
        // we can end the conversation here
        // the buttons will provide the appropriate message
        session.endConversation(message);
    },
]);

bot.dialog('AddNumber', [
    (session, args, next) => {
        var message = null;
        if(!session.privateConversationData.runningTotal) {
            message = `Give me the first number.`;
            session.privateConversationData.runningTotal = 0;
        } else {
            message = `Give me the next number, or say **total** to display the total.`;
        }
        builder.Prompts.number(session, message, {maxRetries: 3});
    },
    (session, results, next) => {
        if(results.response) {
            session.privateConversationData.runningTotal += results.response;
            session.replaceDialog('AddNumber');
        } else {
            session.endConversation(`Sorry, I don't understand. Let's start over.`);
        }
    },
])
.triggerAction({matches: /^add$/i})
.cancelAction('CancelAddNumber', 'Operation cancelled', {
    matches: /^cancel$/,
    onSelectAction: (session, args) => {
        session.endConversation(`Operation cancelled.`);
    },
    confirmPrompt: `Are you sure you wish to cancel?`
})
.beginDialogAction('Total', 'Total', { matches: /^total$/})
.beginDialogAction('HelpAddNumber', 'Help', { matches: /^help$/, dialogArgs: {action: 'AddNumber'} });

bot.dialog('Total', [
    (session, results, next) => {
        session.endConversation(`The total is ${session.privateConversationData.runningTotal}`);
    },
]);

bot.dialog('Help', [
    (session, args, next) => {
        var message = '';
        switch(args.action) {
            case 'AddNumber':
                message = 'You can either type the next number, or use **total** to get the total.';
                break;
            default:
                message = 'You can type **add** to add numbers.';
                break;
        }
        session.endDialog(message);
    }
])
.triggerAction({
    matches: /^help/i	
    });
