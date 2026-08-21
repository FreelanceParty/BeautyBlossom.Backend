const multer = require("multer");
const path = require("path");

// --- 1. Конфігурація для Email (використовує diskStorage та array) ---
const storageEmail = multer.diskStorage({
	destination: function (req, file, cb) {
		const apiURL = "/var/public/uploads";
		// const apiURL = "public/uploads";
		cb(null, apiURL);
	},
	filename:    function (req, file, cb) {
		cb(null, Date.now() + path.extname(file.originalname));
	},
});

const uploadEmail = multer({storage: storageEmail}).array("file", 100);

// multer обєет налаштувань
// destination це шлях тимчасової папки
// файл нейм file це файл який ми зберігли в памяті
// спрацьовує коли малтер зберіш його в пвмять але ще не зберіг на диск
// --- 2. Конфігурація для Product Review (використовує memoryStorage та single) ---
const MAX_IMAGE_SIZE_BYTES = 2048 * 1024;

// const multer = require("multer");
// const path = require("path");
const storageProduct = multer.memoryStorage(); // Зберігання у пам'яті для Base64

// const tempDir = path.join(__dirname, "../", "temp");

// const multerConfig = multer.diskStorage({
//     destination: tempDir,
//     filename: (req, file, cb) =>{
//         cb(null, file.originalname);
//     }
// });

const uploadProductImage = multer({
	storage:    storageProduct,
	limits:     {
		fileSize: MAX_IMAGE_SIZE_BYTES
	},
	fileFilter: (req, file, cb) => {
		if (file.mimetype.startsWith('image/')) {
			cb(null, true);
		} else {
			cb(new Error('Невірний тип файлу. Дозволено лише зображення.'), false);
		}
	}
}).single('image');

// const upload = multer({
//     storage: multerConfig
// })

// module.exports = upload;

const MAX_IMPORT_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

const XLSX_MIME_TYPES = [
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"application/vnd.ms-excel",
	"application/octet-stream",
];

const uploadImportFile = multer({
	storage:    multer.memoryStorage(),
	limits:     {fileSize: MAX_IMPORT_SIZE_BYTES},
	fileFilter: (req, file, cb) => {
		const isXlsxExt = /\.xlsx$/i.test(file.originalname || "");
		if (XLSX_MIME_TYPES.includes(file.mimetype) && isXlsxExt) {
			cb(null, true);
		} else if (isXlsxExt) {
			cb(null, true);
		} else {
			cb(new Error("Дозволено лише файли формату .xlsx"), false);
		}
	},
}).single("file");

module.exports = {
	uploadEmail,
	uploadProductImage,
	uploadImportFile,
};