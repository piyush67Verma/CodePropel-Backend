const validator = require('validator');

const validateUser = (data) => {
    const mandatoryFields = ["firstName", "emailId", "password"];
    const isAllowed = mandatoryFields.every((field) => {
        return Object.keys(data).includes(field);
    })
    if (!isAllowed) {
        throw new Error('Some field missing');
    }
    if (!validator.isEmail(data.emailId)) {
        throw new Error("Invalid Email");
    }
    // if (!validator.isStrongPassword(data.password)) {
    //     throw new Error("Weak Password");
    // }
}

module.exports = validateUser;