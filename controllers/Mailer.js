const nodemailer = require('nodemailer');
const neh = require('nodemailer-express-handlebars');
const path = require('path');

const dotenv = require('dotenv');
dotenv.config();

async function Mailer(to, type, data){

    console.log(data);

    if(process.env.environment === 'production'){
        let testAccount = await nodemailer.createTestAccount();

        let transporter = nodemailer.createTransport({
            host: testAccount.smtp.host, 
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure, // true for 465, false for other ports
            auth: {
                user: testAccount.user, // generated ethereal user
                pass: testAccount.pass // generated ethereal password
            }
        });

        transporter.use('compile', neh({
            viewEngine: {
                extName: '.hbs',
                partialsDir: 'views/partials',
                layoutsDir: 'views/layouts',
                defaultLayout: '',
            },
            viewPath: './views/mail',
            extName: '.hbs'
        }));

        // send mail with defined transport object
        let info = await transporter.sendMail({
            from: '"Hybrid Encrypt" <hello@hybridencrypt.com>', // sender address
            to: to, // list of receivers
            subject: data.title, // Subject line
            template: type, // plain text body
            context: data
        });

        console.log("Message sent: %s", info.messageId);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));



    } else {

        let transporter = nodemailer.createTransport({
            host: "mail.privateemail.com", //smtp.ethereal.com
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
            user: process.env.mailUser, // generated ethereal user
            pass: process.env.mailPass // generated ethereal password
            }
        });

        transporter.use('compile', neh({
            viewEngine: {
                extName: '.hbs',
                partialsDir: 'views/partials',
                layoutsDir: 'views/layouts',
                defaultLayout: '',
            },
            viewPath: './views/mail',
            extName: '.hbs'
        }));

        // send mail with defined transport object
        let info = await transporter.sendMail({
            from: '"Hybrid Encrypt" <hello@hybridencrypt.com>', // sender address
            to: to, // list of receivers
            subject: data.title, // Subject line
            template: type, // plain text body
            context: data
        });

        console.log("Message sent: %s", info.messageId);


    }

}

module.exports = Mailer;