"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationController = void 0;
const notificationBuilder_1 = require("../interfaces/notificationBuilder");
const email_producer_1 = require("../rabbitmq/producers/email-producer");
const user_db_1 = require("../repositories/user.db");
const brevoService_1 = require("../services/brevoService");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const ApiResponse_1 = __importDefault(require("../utils/ApiResponse"));
const technicalEmail = 'techjeearchive@gmail.com';
class NotificationController {
    emailInstance;
    constructor(emailInstance) {
        this.emailInstance = emailInstance;
    }
    // sending the Notification Through The Email To Particular User 
    sendingEmailParticularUser = async (req, res) => {
        try {
            const { to, subject, content } = req.body;
            const payload = (new notificationBuilder_1.NotificationBuilder())
                .setToEmail(to)
                .setSubject(subject)
                .setContent(content)
                .setType("Notification")
                .build();
            await this.emailInstance.send(payload);
            return res.status(200).json(new ApiResponse_1.default("Message is Sended"));
        }
        catch (err) {
            return res.status(500).json(new ApiError_1.default("Message is Not Sended", err));
        }
    };
    // user contanct details message 
    sendingEmailToAllUser = async (req, res) => {
        try {
            const { subject, content } = req.body;
            // getting all the user 
            const allTheUser = await user_db_1.user.gettingAllUser();
            for (let i = 0; i < allTheUser.length; i++) {
                const payload = (new notificationBuilder_1.NotificationBuilder())
                    .setToEmail(allTheUser[i].email)
                    .setSubject(subject)
                    .setContent(content)
                    .setType("Notification")
                    .build();
                await this.emailInstance.send(payload);
            }
            return res.status(200).json(new ApiResponse_1.default("Email is Sended To Every One Perfectfully"));
        }
        catch (err) {
            return res.status(500).json("Email is not sended to Everyone", err);
        }
    };
    emailToSupport = async (req, res) => {
        try {
            const { content } = req.body;
            const userId = req.user;
            const detailsOfUser = await user_db_1.user.userDetailsThroughStudentId(userId);
            const userSubject = `Technical Glitch From The User ${detailsOfUser.allTheUserDetails?.name} having student Id ${detailsOfUser.studentDetails?.id} and email ${detailsOfUser.allTheUserDetails?.email}`;
            const payload = (new notificationBuilder_1.NotificationBuilder())
                .setToEmail(technicalEmail)
                .setSubject(userSubject)
                .setContent(content)
                .setType("Technical Email")
                .build();
            await email_producer_1.emailProducer.send(payload);
            return res.status(200).json(new ApiResponse_1.default("Email Is Sended SuccessFully"));
        }
        catch (err) {
            return res.status(500).json(new ApiError_1.default("Email Is Not Sended", err));
        }
    };
}
exports.notificationController = new NotificationController(brevoService_1.emailService);
