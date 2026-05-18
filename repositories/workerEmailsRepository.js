const {WorkerEmail} = require("../models/workerEmail");

const findActiveByEvent = (event) => {
	return WorkerEmail.find({isActive: true, events: event});
};

module.exports = {
	findActiveByEvent,
};
