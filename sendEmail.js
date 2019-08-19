const nodemailer = require('nodemailer');
function sendEmail(to, subject, text){
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL,
            pass: process.env.GMAILPW
        }
    })
    const mailOptions = {
        from: process.env.GMAIL,
        to,
        subject,
        text
    }

    transporter.sendMail(mailOptions, (error,info)=>{
        if (error){ 
            console.log(error)
        } else {
            console.log("Email sent: ", info.response);
        }
})}

module.exports = sendEmail