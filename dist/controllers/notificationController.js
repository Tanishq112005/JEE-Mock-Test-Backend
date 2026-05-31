"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationController = void 0;
const client_1 = require("@prisma/client");
const notificationBuilder_1 = require("../interfaces/notificationBuilder");
const email_producer_1 = require("../rabbitmq/producers/email-producer");
const user_db_1 = require("../repositories/user.db");
const brevoService_1 = require("../services/brevoService");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const ApiResponse_1 = __importDefault(require("../utils/ApiResponse"));
const notifications_db_1 = require("../repositories/notifications.db");
const technicalEmail = 'techjeearchive@gmail.com';
class NotificationController {
    emailInstance;
    constructor(emailInstance) {
        this.emailInstance = emailInstance;
    }
    // sending the Notification Through The Email To Particular User 
    sendingEmailParticularUser = async (req, res) => {
        try {
            const { to, subject, content, student_Id, type } = req.body;
            const message = (new notificationBuilder_1.NotificationBuilder())
                .setToEmail(to)
                .setSubject(subject)
                .setContent(content)
                .setType(type)
                .setTo(client_1.SendingPerson.User)
                .setFrom(client_1.SendingPerson.Developer)
                .setStudentId(student_Id)
                .build();
            await this.emailInstance.send(message);
            const isValidString = (val) => typeof val === "string" && val.trim().length > 0;
            // Extract the string values RabbitMQ gave us
            const incomingTo = message.to;
            const incomingFrom = message.from;
            const incomingType = message.type;
            // Verify if those strings actually match your Prisma Enums
            const isToValid = Object.values(client_1.SendingPerson).includes(incomingTo);
            const isFromValid = Object.values(client_1.SendingPerson).includes(incomingFrom);
            const isTypeValid = Object.values(client_1.NotificationTypes).includes(incomingType);
            // 2. Validate and Save to Database
            if (isValidString(message.studentId) &&
                isValidString(message.content) &&
                isValidString(message.subject) &&
                isToValid &&
                isFromValid &&
                isTypeValid) {
                console.log("Worker Validation passed. Offloading DB write...");
                // Safely cast the strings back to Enums for Prisma
                await notifications_db_1.notificationRepositories.addingNotifications(message.studentId, incomingTo, incomingFrom, message.content, message.subject, new Date(), ["Email"], incomingType);
                console.log("Worker successfully saved to database.");
            }
            else {
                console.error(" Worker DB Storage skipped. Data mismatch:", {
                    to: incomingTo, from: incomingFrom, type: incomingType
                });
            }
            return res.status(200).json(new ApiResponse_1.default("Message is Sended"));
        }
        catch (err) {
            return res.status(500).json(new ApiError_1.default("Message is Not Sended", err));
        }
    };
    // user contanct details message 
    sendingEmailToAllUser = async (req, res) => {
        try {
            const { subject, content, type } = req.body;
            // getting all the user 
            const allTheUser = await user_db_1.user.gettingAllUser();
            console.log(allTheUser);
            for (let i = 0; i < allTheUser.length; i++) {
                const message = (new notificationBuilder_1.NotificationBuilder())
                    .setToEmail(allTheUser[i].email)
                    .setSubject(subject)
                    .setContent(content)
                    .setType(type)
                    .setFrom(client_1.SendingPerson.Developer)
                    .setTo(client_1.SendingPerson.User)
                    .setStudentId(allTheUser[i].student_profile.id)
                    .build();
                await this.emailInstance.send(message);
                const isValidString = (val) => typeof val === "string" && val.trim().length > 0;
                // Extract the string values RabbitMQ gave us
                const incomingTo = message.to;
                const incomingFrom = message.from;
                const incomingType = message.type;
                // Verify if those strings actually match your Prisma Enums
                const isToValid = Object.values(client_1.SendingPerson).includes(incomingTo);
                const isFromValid = Object.values(client_1.SendingPerson).includes(incomingFrom);
                const isTypeValid = Object.values(client_1.NotificationTypes).includes(incomingType);
                // 2. Validate and Save to Database
                if (isValidString(message.studentId) &&
                    isValidString(message.content) &&
                    isValidString(message.subject) &&
                    isToValid &&
                    isFromValid &&
                    isTypeValid) {
                    console.log("Worker Validation passed. Offloading DB write...");
                    // Safely cast the strings back to Enums for Prisma
                    await notifications_db_1.notificationRepositories.addingNotifications(message.studentId, incomingTo, incomingFrom, message.content, message.subject, new Date(), ["Email"], incomingType);
                    console.log("Worker successfully saved to database.");
                }
                else {
                    console.error(" Worker DB Storage skipped. Data mismatch:", {
                        to: incomingTo, from: incomingFrom, type: incomingType
                    });
                }
            }
            return res.status(200).json(new ApiResponse_1.default("Email is Sended To Every One Perfectfully"));
        }
        catch (err) {
            return res.status(500).json("Email is not sended to Everyone", err);
        }
    };
    emailToSupport = async (req, res) => {
        try {
            const { content, type } = req.body;
            const userId = req.user;
            // 1. Fetch user details
            const detailsOfUser = await user_db_1.user.userDetailsThroughStudentId(userId);
            // 2. Validate the incoming 'type' against your NotificationTypes enum/object
            // Check if the provided 'type' exists in your NotificationTypes values
            const isValidType = Object.values(client_1.NotificationTypes).includes(type);
            if (!isValidType) {
                return res.status(400).json(new ApiError_1.default("Invalid notification type provided"));
            }
            const userSubject = `Technical Glitch From The User ${detailsOfUser.allTheUserDetails?.name} having student Id ${detailsOfUser.studentDetails?.id} and email ${detailsOfUser.allTheUserDetails?.email}`;
            // 3. Build the payload
            const payload = (new notificationBuilder_1.NotificationBuilder())
                .setToEmail(technicalEmail)
                .setFrom(client_1.SendingPerson.User)
                .setTo(client_1.SendingPerson.Developer)
                .setStudentId(detailsOfUser.studentDetails?.id)
                .setSubject(userSubject)
                .setContent(content)
                .setType(type) // Pass the validated type directly
                .build();
            // 4. Send and respond
            await email_producer_1.emailProducer.send(payload);
            return res.status(200).json(new ApiResponse_1.default("Email Sent Successfully"));
        }
        catch (err) {
            return res.status(500).json(new ApiError_1.default("Email Is Not Sended", err));
        }
    };
    getEmailsOfUser = async (req, res) => {
        try {
            const studentId = req.user;
            const allNotificationsOfUser = await notifications_db_1.notificationRepositories.gettingAllTheNotificationsForUser(studentId);
            return res.status(200).json(new ApiResponse_1.default("User All Notifications", allNotificationsOfUser));
        }
        catch (err) {
            return res.status(500).json(new ApiError_1.default("Error in getting the Email For The User", err));
        }
    };
    gettingEmailFromTheAllTheUser = async (req, res) => {
        try {
            const allNotifications = await notifications_db_1.notificationRepositories.gettingAllTheNotificationsWithUserData();
            return res.status(200).json(new ApiResponse_1.default("All Notifications From The User's", allNotifications));
        }
        catch (err) {
            return res.status(500).json(new ApiError_1.default("Error in getting the Email For All The User By Developer", err));
        }
    };
    gettingEmailFromTheParticularUser = async (req, res) => {
        try {
            const { studentId } = req.body;
            const allNotifications = await notifications_db_1.notificationRepositories.gettingAllTheComingNotificationsFromUser(studentId);
            return res.status(200).json(new ApiResponse_1.default(`All Notifications From Particular  User having studentId - ${studentId}`, allNotifications));
        }
        catch (err) {
            return res.status(500).json(new ApiError_1.default("Error in getting the Email For Particular  User By Developer", err));
        }
    };
}
exports.notificationController = new NotificationController(brevoService_1.emailService);
