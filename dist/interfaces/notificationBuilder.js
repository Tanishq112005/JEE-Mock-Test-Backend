"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationBuilder = void 0;
class NotificationBuilder {
    message;
    constructor() {
        // We create a fresh instance to hold our data
        this.message = {};
    }
    setToEmail(email) {
        this.message.toEmail = email;
        return this;
    }
    setToPhone(phone) {
        this.message.toPhone = phone;
        return this;
    }
    setSubject(subject) {
        this.message.subject = subject;
        return this;
    }
    setContent(content) {
        this.message.content = content;
        return this;
    }
    addCc(email) {
        if (!this.message.cc) {
            this.message.cc = [];
        }
        this.message.cc.push(email);
        return this;
    }
    setFrom(from) {
        this.message.from = from;
        return this;
    }
    setTo(to) {
        this.message.to = to;
        return this;
    }
    setType(type) {
        this.message.type = type;
        return this;
    }
    setStudentId(type) {
        this.message.studentId = type;
        return this;
    }
    fromJSON(data) {
        const rawData = data.message ? data.message : data;
        Object.assign(this.message, rawData);
        return this;
    }
    build() {
        // You can add validation here (e.g., must have an email or phone)
        if (!this.message.toEmail && !this.message.toPhone) {
            throw new Error("Cannot build notification: No destination (email or phone) provided.");
        }
        return this.message;
    }
}
exports.NotificationBuilder = NotificationBuilder;
