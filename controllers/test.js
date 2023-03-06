// Load The User Model
const User = require('../models/User');

// Look for all Users With an Active Status
User.find({status: 'active'}).then(users => {
	// Now Loop Through the users
	for (var i = 0; i >= users.length; i++) {
		
		// Update Each Users Status Text
		// Just for the example
		user.statusText = 'My name is ' + user.firstname + ' and i\'m ' + user.age + ' Years Old';

		//save the modified users object to the database
		//this is the asynchronous function
		user.save().then(savedUser => console.log('user status updated'));
	}
})