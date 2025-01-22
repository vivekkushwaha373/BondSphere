const datauriParser = require('datauri/parser');
const path = require('path');

const parser = new datauriParser();

exports.getDataUri = (file) => {
    const extName = path.extname(file.originalname).toString();
    return parser.format(extName, file.buffer).content;
}
