"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRepositories = void 0;
const client_1 = require("@prisma/client");
const database_1 = require("../lib/database");
class Notification {
    db;
    constructor(database) {
        this.db = database;
    }
    // getting  all the notifications of the particular user 
    async gettingAllTheNotificationsForUser(studentId) {
        try {
            const allNotifications = await this.db.userNotifications.findMany({
                where: {
                    to: client_1.SendingPerson.User,
                    studentId: studentId
                },
                orderBy: {
                    created_at: 'desc'
                }
            });
            return allNotifications;
        }
        catch (err) {
            console.error("Error in getting the notifications of the User");
            throw err;
        }
    }
    // adding the notification 
    async addingNotifications(studentId, to, from, content, subject, created_at, sendingMedium, type) {
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
        }
        catch (err) {
            console.error("Error creating notification:", err);
            throw err;
        }
    }
    // developers api endpoint 
    // getting the notifications from the particular user 
    async gettingAllTheComingNotificationsFromUser(studentId) {
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
                        from: client_1.SendingPerson.User
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
        }
        catch (err) {
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
                where: { from: client_1.SendingPerson.User },
                include: {
                    user: {
                        include: {
                            user: true
                        }
                    }
                },
                orderBy: { created_at: 'desc' }
            });
            const userMap = new Map();
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
                userMap.get(studentId).notifications.push(cleanNotification);
            }
            // Return as an Array so Express can stringify it properly
            return Array.from(userMap.values());
        }
        catch (err) {
            console.error("Error fetching notifications:", err);
            throw err;
        }
    }
}
exports.notificationRepositories = new Notification(database_1.database);
