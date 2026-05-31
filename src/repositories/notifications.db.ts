import { NotificationTypes, Prisma, PrismaClient, SendingPerson, user, userNotifications } from "@prisma/client";
import { database } from "../lib/database";

class Notification {
    private db: PrismaClient;

    constructor(database: PrismaClient) {
        this.db = database;
    }

    // getting  all the notifications of the particular user 
    async gettingAllTheNotificationsForUser(studentId: string) {
        try {
            const allNotifications = await this.db.userNotifications.findMany({
                where: {
                    to: SendingPerson.User,
                    studentId: studentId
                } ,
                orderBy : {
                    created_at : 'desc'
                }
            })

            return allNotifications;
        }
        catch (err: any) {
            console.error("Error in getting the notifications of the User");
            throw err;
        }
    }

    // adding the notification 
    async addingNotifications(
        studentId: string,
        to: SendingPerson,
        from: SendingPerson,
        content: string,
        subject: string,
        created_at: Date,
        sendingMedium: Prisma.InputJsonValue ,
        type : NotificationTypes
    ) {
        try {
            const newNotification = await this.db.userNotifications.create({
                data: {
                    studentId,
                    to,
                    from,
                    content,
                    subject,
                    created_at,
                    sendingMedium,
                    type
                }
            });

        } catch (err: any) {
            console.error("Error creating notification:", err);
            throw err;
        }
    }
    
    // developers api endpoint 
    // getting the notifications from the particular user 
    async gettingAllTheComingNotificationsFromUser(studentId: string) {
        try {
            const [user, allNotifications] = await Promise.all([
                // 1. Get the user linked to this specific student profile
                this.db.user.findFirst({
                    where: {
                        student_profile: { id: studentId }
                    }
                }),
             
                this.db.userNotifications.findMany({
                    where: {
                        studentId: studentId,
                        from: SendingPerson.User
                    },
                    orderBy: {
                        created_at: 'desc'
                    }
                })
            ]);

            return {
                userInformation: user, 
                allNotificationsOfUser: allNotifications
            };
        } catch (err: any) {
            console.error("Error in getting all the notification of the User:", err);
            throw err;
        }
    }
    
    // developers api Endpoint 
    // getting all the notifications from the user 
    async gettingAllTheNotificationsWithUserData() {
        try {
            // This single query fetches all notifications and the associated student/user
            const allNotifications = await this.db.userNotifications.findMany({
                where: { from: SendingPerson.User },
                include: {
                    user: { 
                        include: {
                            user: true 
                        }
                    }
                },
                orderBy: { created_at: 'desc' }
            });

            const userMap = new Map<string, { user: any, notifications: any[] }>();

            for (const notif of allNotifications) {
                const studentId = notif.studentId;
                
                if (!userMap.has(studentId)) {
                    // Spread the user data, but safely convert BigInt phone to string
                    // This prevents the JSON serialization crash AND the TS type error
                    const studentData = {
                        ...notif.user,
                        phone: notif.user.phone ? notif.user.phone.toString() : null
                    };

                    userMap.set(studentId, {
                        user: studentData, 
                        notifications: []
                    });
                }
                
                // Remove the bulky user object from each individual notification for cleaner JSON
                const cleanNotification = { ...notif, user: undefined };
                userMap.get(studentId)!.notifications.push(cleanNotification);
            }

            // Return as an Array so Express can stringify it properly
            return Array.from(userMap.values());

        } catch (err: any) {
            console.error("Error fetching notifications:", err);
            throw err;
        }
    }
} 

export const notificationRepositories = new Notification(database);