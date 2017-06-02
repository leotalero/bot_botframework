var restify = require('restify');
var builder = require('botbuilder');

var apiai = require('apiai');
var app = apiai("84f6469c02c2406db34ba17e7a74a5a1");






/*
var request = app.textRequest('despiertame a las 10 am', {
    sessionId: ' Math.random()'
});

request.on('response', function(response) {
    console.log(response);
});

request.on('error', function(error) {
    console.log(error);
});

request.end();
*/


// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
	//appId: process.env.2ec20dc4-244f-4d88-89ab-f544cabba17b,
    //appPassword: process.env.zbxDyJvrhXFDKn3bKCzbgPk
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



// Install a custom recognizer to look for user saying 'help' or 'goodbye'.
bot.recognizer({
  recognize: function (context,callback) {
	    var request = app.textRequest(context.message.text, {
            sessionId: 'Math.random()'
            
        });
      
        request.on('response', function (response) {
            var result = response.result;

            callback(null, {
                intent: result.metadata.intentName,
                score: result.score,
                entities: Object.keys(result.parameters)
                    .filter(key => !!result.parameters[key])
                    .map(key => ({
                        entity: result.parameters[key],
                        type: key,
                        score: 1
                    })),
				fulfillment:result.fulfillment	
					
            });
			
        });

        request.on('error', function (error) {
            callback(error);
        });

        request.end();
    }
});

// Add a global LUIS recognizer to the bot by using the endpoint URL of the LUIS app
//var model = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/9a8fa015-c655-47eb-b676-365f39fd9ffc?subscription-key=559f5cafd3d74e2488cc1383562efece&verbose=true&timezoneOffset=0&q=';
//bot.recognizer(new builder.LuisRecognizer(model));



// Add a help dialog with a trigger action that is bound to the 'Help' intent
bot.dialog('helpDialog', function (session) {
    session.endDialog("This bot will echo back anything you say. Say 'goodbye' to quit.");
}).triggerAction({ matches: 'Help' });

bot.dialog('wakemeup', function(session, args){ 
		console.log('args: '+JSON.stringify(args));
	var fulfillment = args.intent.fulfillment;
		console.log('fulfillment: '+fulfillment);
	if (fulfillment){ 
	console.log('if: entr al if');
	 var speech = fulfillment.speech; 
	 session.send(speech); }
	 else{ 
	 session.send('Sorry...not sure how to respond to that'); 
	 }
	 }).triggerAction({ matches: 'wake me up' });

// Add a global endConversation() action that is bound to the 'Goodbye' intent
bot.endConversationAction('goodbyeAction', "Ok... See you later.", { matches: 'Goodbye' });





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

	

	
	
	
