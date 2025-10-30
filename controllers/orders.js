// const wood = require("../WoodStorage/wood")

const {orders} = require('../models/orders')

const {HttpError, ctrlWrapper} = require("../helpers");

const getAll = async (req, res) => {
	// const {_id: owner} = req.user; // щоб отримува тіоьки той хто створив
	// const {page = 1, limit = 10} = req.query;
	// req.query обєкт параметрів пошуку
	// const skip = (page - 1) * limit;
	const result = await orders.find();
	// const result = await inProgressDesk.find();
	// const result = await inProgressDesk.find({owner}, "-createdAt -updatedAt", {skip, limit}).populate("owner", "name email");

	// const result = await orders.find({owner}, "-createdAt -updatedAt").populate("owner", "name email");
	// -createdAt -updatedAt поля які не треба брати з бази
	// populate бере айді знаходить овенра і вставляє обєкт з його данними
	// 2 арг список полів які треба повернути
	// skip скілеи пропустити обєктів в базі, limit скільки повернути
	res.json(result);
}

const add = async (req, res) => {

	const owner = req.user ? req.user._id : null; // Якщо req.user визначений, то беремо його _id, інакше owner = null
	const result = await orders.create({...req.body, owner});
	//  const result = await Wood.create({...req.body});

	res.status(201).json(result);
}

const getAllbyUser = async (req, res) => {
	const {user} = req; // Припустимо, що ви отримуєте інформацію про користувача з middleware
	const userId = user._id.toString().trim();
	const userOrders = await orders.find({owner: userId});

	res.json(userOrders);
};

const getById = async (req, res) => {
	const {id} = req.params;
	// const result = await Book.findOne({_id: id})
	const result = await orders.findById(id);
	if (!result) {
		throw HttpError(404, "Not found");
	}
	res.json(result);
}

// const add = async (req, res) => {

//     const { _id: owner } = req.user;
// console.log("йобаний юзер", req.user);

//     const result = await orders.create({ ...req.body, owner });
//     //  const result = await Wood.create({...req.body});

//     res.status(201).json(result);

// }

const updateById = async (req, res) => {
	const {id} = req.params;
	const result = await orders.findByIdAndUpdate(id, req.body, {new: true});
	if (!result) {
		throw HttpError(404, "Not found");
	}
	res.json(result);
}

// const updateById = async (req, res) => {
//   const { id } = req.params;
//   const { amount } = req.body;

//     const currentItem = await orders.findById(id);

//     if (!currentItem) {
//       throw HttpError(404, "Not found");
//     }

//     currentItem.amount += parseInt(amount);
//     await currentItem.save();

//     res.json(currentItem);

// };

const updateCheked = async (req, res) => {
	const {id} = req.params;
	const result = await orders.findByIdAndUpdate(id, req.body, {new: true});
	if (!result) {
		throw HttpError(404, "Not found");
	}
	res.json(result);
}

const deleteById = async (req, res) => {
	const {id} = req.params;
	const result = await orders.findByIdAndRemove(id);
	if (!result) {
		throw HttpError(404, "Not found");
	}
	res.json({
		message: "Delete success"
	})
}

// const getAll = async (req, res) => {
//     const result = await wood.getAll();
//     res.json(result);
// }

// const add = async (req, res) => {
//     const result = await wood.add(req.body);
//     res.status(201).json(result);
// }

// const updateById = async (req, res) => {
//     const { id } = req.params;
//     const result = await wood.updateById(id, req.body);
//     if (!result) {
//         throw HttpError(404, "Not found");
//     }
//     res.json(result);
// }

// const deleteById = async (req, res) => {
//     const { id } = req.params;
//     const result = await wood.deleteById(id);
//     if (!result) {
//         throw HttpError(404, "Not found");
//     }
//     // res.status(204).send()
//     res.json({
//         message: "Delete success"
//     })
// }

module.exports = {
	getAllbyUser: ctrlWrapper(getAllbyUser),
	getAll:       ctrlWrapper(getAll),
	getById:      ctrlWrapper(getById),
	add:          ctrlWrapper(add),
	updateById:   ctrlWrapper(updateById),
	updateCheked: ctrlWrapper(updateCheked),
	deleteById:   ctrlWrapper(deleteById),
}