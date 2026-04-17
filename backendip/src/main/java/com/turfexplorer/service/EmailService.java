package com.turfexplorer.service;

import com.turfexplorer.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.email.sender}")
    private String senderEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOtpEmail(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(senderEmail);
        message.setTo(toEmail);
        message.setSubject("Your OTP Code");
        message.setText("Your OTP is: " + otp);
        try {
            mailSender.send(message);
        } catch (MailException ex) {
            throw new BadRequestException("Unable to send OTP email right now. Please try again shortly.");
        }
    }

    public void sendPasswordResetOtpEmail(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(senderEmail);
        message.setTo(toEmail);
        message.setSubject("Your Password Reset OTP Code");
        message.setText("Your password reset OTP is: " + otp + "\nThis OTP will expire in 5 minutes.");
        try {
            mailSender.send(message);
        } catch (MailException ex) {
            throw new BadRequestException("Unable to send password reset OTP email right now. Please try again shortly.");
        }
    }
}
