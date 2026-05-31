import { NotificationTypes, SendingPerson } from "@prisma/client";
import { NotificationBuilder } from "../interfaces/notificationBuilder";
import { INotificationService, NotificationMessage } from "../interfaces/notificationInterface";
import { emailProducer } from "../rabbitmq/producers/email-producer";
import { user } from "../repositories/user.db";
import { emailService } from "../services/brevoService";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { notificationRepositories } from "../repositories/notifications.db";




const technicalEmail: string = 'techjeearchive@gmail.com';


class NotificationController {

    private emailInstance: INotificationService;
    constructor(emailInstance: INotificationService) {
        this.emailInstance = emailInstance;
    }



    // sending the Notification Through The Email To Particular User 
    public sendingEmailParticularUser = async (req: any, res: any) => {
        try {
            const { to, subject, content, student_Id, type } = req.body;

            const payload: NotificationMessage = (new NotificationBuilder())
                .setToEmail(to)
                .setSubject(subject)
                .setContent(content)
                .setType(type)
                .setTo(SendingPerson.User)
                .setFrom(SendingPerson.Developer)
                .setStudentId(student_Id)
                .build();

            await this.emailInstance.send(payload);

            return res.status(200).json(
                new ApiResponse(
                    "Message is Sended"
                )
            )
        }
        catch (err: any) {
            return res.status(500).json(
                new ApiError(
                    "Message is Not Sended",
                    err
                )
            )
        }
    }

    // user contanct details message 
    public sendingEmailToAllUser = async (req: any, res: any) => {
        try {

            const { subject, content, type } = req.body;

            // getting all the user 
            const allTheUser = await user.gettingAllUser();
            console.log(allTheUser);

            for (let i = 0; i < allTheUser.length; i++) {
                const payload: NotificationMessage = (new NotificationBuilder())
                    .setToEmail(allTheUser[i].email)
                    .setSubject(subject)
                    .setContent(content)
                    .setType(type)
                    .setFrom(SendingPerson.Developer)
                    .setTo(SendingPerson.User)
                    .setStudentId(allTheUser[i].student_profile.id)
                    .build();

                await this.emailInstance.send(payload);

            }

            return res.status(200).json(
                new ApiResponse(
                    "Email is Sended To Every One Perfectfully"
                )
            )

        }
        catch (err: any) {
            return res.status(500).json(
                "Email is not sended to Everyone", err
            )
        }
    }



    public emailToSupport = async (req: any, res: any) => {
        try {
            const { content, type } = req.body;
            const userId = req.user;

            // 1. Fetch user details
            const detailsOfUser = await user.userDetailsThroughStudentId(userId);

            // 2. Validate the incoming 'type' against your NotificationTypes enum/object
            // Check if the provided 'type' exists in your NotificationTypes values
            const isValidType = Object.values(NotificationTypes).includes(type);

            if (!isValidType) {
                return res.status(400).json(new ApiError("Invalid notification type provided"));
            }

            const userSubject = `Technical Glitch From The User ${detailsOfUser.allTheUserDetails?.name} having student Id ${detailsOfUser.studentDetails?.id} and email ${detailsOfUser.allTheUserDetails?.email}`;

            // 3. Build the payload
            const payload: NotificationMessage = (new NotificationBuilder())
                .setToEmail(technicalEmail)
                .setFrom(SendingPerson.User)
                .setTo(SendingPerson.Developer)
                .setStudentId(detailsOfUser.studentDetails?.id)
                .setSubject(userSubject)
                .setContent(content)
                .setType(type) // Pass the validated type directly
                .build();

            // 4. Send and respond
            await emailProducer.send(payload);

            return res.status(200).json(
                new ApiResponse("Email Sent Successfully")
            );


        }
        catch (err: any) {
            return res.status(500).json(
                new ApiError(
                    "Email Is Not Sended",
                    err
                )
            )
        }
    }


    public getEmailsOfUser = async (req: any, res: any) => {
        try {
            const studentId = req.user;
            const allNotificationsOfUser = await notificationRepositories.gettingAllTheNotificationsForUser(studentId);
            return res.status(200).json(
                new ApiResponse(
                    "User All Notifications",
                    allNotificationsOfUser
                )
            )
        }
        catch (err: any) {
            return res.status(500).json(
                new ApiError(
                    "Error in getting the Email For The User",
                    err
                )
            )
        }
    }


    public gettingEmailFromTheAllTheUser = async (req: any, res: any) => {
        try {
            const allNotifications = await notificationRepositories.gettingAllTheNotificationsWithUserData();
            return res.status(200).json(
                new ApiResponse(
                    "All Notifications From The User's",
                    allNotifications
                )
            )
        }
        catch (err: any) {
            return res.status(500).json(
                new ApiError(
                    "Error in getting the Email For All The User By Developer",
                    err
                )
            )
        }
    }


    public gettingEmailFromTheParticularUser = async (req: any, res: any) => {
        try {
            const { studentId } = req.body;
            const allNotifications = await notificationRepositories.gettingAllTheComingNotificationsFromUser(studentId);
            return res.status(200).json(
                new ApiResponse(
                    `All Notifications From Particular  User having studentId - ${studentId}`,
                    allNotifications
                )
            )
        }
        catch (err: any) {
            return res.status(500).json(
                new ApiError(
                    "Error in getting the Email For Particular  User By Developer",
                    err
                )
            )
        }
    }


}


export const notificationController = new NotificationController(emailService)