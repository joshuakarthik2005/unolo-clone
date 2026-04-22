import nodemailer from 'nodemailer';

// Use Ethereal for testing, or real SMTP in prod
let transporter;

const initEmail = async () => {
    if(process.env.SMTP_HOST) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    } else {
        // Fallback to ethereal for testing
        let testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        console.log("No SMTP details provided. Using Ethereal Email for testing.");
    }
};

initEmail();

export const sendTaskEmail = async (to, taskTitle) => {
    try {
        let info = await transporter.sendMail({
            from: '"Unolo System" <no-reply@unolo.com>',
            to,
            subject: "New Task Assigned",
            text: `You have been assigned a new task: ${taskTitle}. Please check your dashboard.`,
            html: `<b>You have been assigned a new task:</b> ${taskTitle}.<br/>Please check your dashboard.`
        });
        console.log("Message sent: %s", info.messageId);
        // console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    } catch(err) {
        console.error("Email send failed", err);
    }
};

export const sendLeaveEmail = async (to, status) => {
    try {
        await transporter.sendMail({
            from: '"Unolo System" <no-reply@unolo.com>',
            to,
            subject: `Leave Request ${status}`,
            text: `Your leave request has been ${status}.`,
            html: `Your leave request has been <b>${status}</b>.`
        });
    } catch(err) {}
};

export const sendExpenseEmail = async (to, status) => {
    try {
        await transporter.sendMail({
            from: '"Unolo System" <no-reply@unolo.com>',
            to,
            subject: `Expense Claim ${status}`,
            text: `Your expense claim has been ${status}.`,
            html: `Your expense claim has been <b>${status}</b>.`
        });
    } catch(err) {}
};
